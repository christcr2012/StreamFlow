import React, { createContext, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { eventTracker, useEventTracking } from '@/lib/event-tracking';

// Context for event tracking
const EventTrackingContext = createContext<ReturnType<typeof useEventTracking> | null>(null);

// Enhanced page tracking hook
export function usePageTracking() {
  const tracking = useContext(EventTrackingContext);
  return tracking;
}

interface EventTrackingProviderProps {
  children: React.ReactNode;
}

export function EventTrackingProvider({ children }: EventTrackingProviderProps) {
  const router = useRouter();
  const tracking = useEventTracking();

  // Track page views automatically on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      tracking.trackPageView(url, {
        previousPath: router.asPath,
        timestamp: Date.now(),
      });
    };

    // Track initial page load
    tracking.trackPageView(router.asPath, {
      initial: true,
      timestamp: Date.now(),
    });

    // Listen for route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, tracking]);

  return (
    <EventTrackingContext.Provider value={tracking}>
      {children}
    </EventTrackingContext.Provider>
  );
}

// Higher-order component for automatic event tracking
export function withEventTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options?: {
    featureKey?: string;
    trackClicks?: boolean;
  }
) {
  return function EventTrackedComponent(props: T) {
    const tracking = usePageTracking();

    useEffect(() => {
      if (options?.featureKey) {
        tracking?.trackEvent({
          featureKey: options.featureKey,
          eventType: 'view',
          metadata: { component: WrappedComponent.name },
        });
      }
    }, [tracking]);

    // Add click tracking to props if requested
    const enhancedProps = options?.trackClicks
      ? {
          ...props,
          'data-feature-key': options?.featureKey,
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            tracking?.trackClick(e.currentTarget);
            // Call original onClick if it exists
            if ('onClick' in props && typeof props.onClick === 'function') {
              (props.onClick as (e: React.MouseEvent<HTMLElement>) => void)(e);
            }
          },
        }
      : props;

    return <WrappedComponent {...enhancedProps} />;
  };
}

// Button component with automatic event tracking
interface TrackedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  featureKey?: string;
  eventMetadata?: Record<string, any>;
}

export function TrackedButton({ 
  featureKey, 
  eventMetadata, 
  onClick, 
  children, 
  ...props 
}: TrackedButtonProps) {
  const tracking = usePageTracking();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track the click event
    if (featureKey) {
      tracking?.trackEvent({
        featureKey,
        eventType: 'click',
        metadata: {
          ...eventMetadata,
          buttonText: typeof children === 'string' ? children : '',
        },
      });
    } else {
      tracking?.trackClick(e.currentTarget, eventMetadata);
    }

    // Call original onClick
    onClick?.(e);
  };

  return (
    <button 
      {...props} 
      onClick={handleClick}
      data-feature-key={featureKey}
    >
      {children}
    </button>
  );
}

// Form wrapper with automatic submission tracking
interface TrackedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  featureKey: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function TrackedForm({ 
  featureKey, 
  onSubmit, 
  children, 
  ...props 
}: TrackedFormProps) {
  const tracking = usePageTracking();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Track form submission
    tracking?.trackEvent({
      featureKey: featureKey + '.submit',
      eventType: 'complete',
      metadata: {
        formId: props.id,
        timestamp: Date.now(),
      },
    });

    onSubmit?.(e);
  };

  return (
    <form {...props} onSubmit={handleSubmit} data-feature-key={featureKey}>
      {children}
    </form>
  );
}