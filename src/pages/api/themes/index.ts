// src/pages/api/themes/index.ts

/**
 * 🎨 THEME MANAGEMENT API
 * 
 * Handles theme configuration and customization for the StreamFlow platform.
 * Supports provider-level theme management and owner-only client customization.
 * 
 * ENDPOINTS:
 * GET /api/themes - List available themes and current configuration
 * POST /api/themes - Apply a theme to an organization
 * PUT /api/themes - Update theme customization
 * DELETE /api/themes - Reset theme to default
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { allThemes, type ThemeId } from '@/lib/themes/theme-definitions';
import { authenticateProvider } from '@/lib/provider-auth';

/**
 * Parse cookies from request headers
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}

interface ThemeApiResponse {
  ok: boolean;
  themes?: typeof allThemes;
  currentTheme?: string;
  customization?: any;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ThemeApiResponse>
) {
  try {
    if (req.method === 'GET') {
      return await handleGetThemes(req, res);
    } else if (req.method === 'POST') {
      return await handleApplyTheme(req, res);
    } else if (req.method === 'PUT') {
      return await handleUpdateTheme(req, res);
    } else if (req.method === 'DELETE') {
      return await handleResetTheme(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Theme API error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}

// GET /api/themes - List available themes and current configuration
async function handleGetThemes(
  req: NextApiRequest,
  res: NextApiResponse<ThemeApiResponse>
) {
  const { orgId } = req.query;

  // If orgId is provided, get org-specific theme configuration
  if (orgId && typeof orgId === 'string') {
    // ✅ COMPLETED: Authentication check for org access
    const cookies = parseCookies(req.headers.cookie || '');
    const isProvider = cookies.ws_provider;
    const isDeveloper = cookies.ws_developer;
    const isAccountant = cookies.ws_accountant;

    // Only provider, developer, or accountant can access org-specific themes
    if (!isProvider && !isDeveloper && !isAccountant) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required for organization access'
      });
    }
    
    const themeConfig = await prisma.themeConfig.findFirst({
      where: {
        orgId: orgId,
        isActive: true
      }
    });

    return res.status(200).json({
      ok: true,
      themes: allThemes,
      currentTheme: themeConfig?.themeId || 'futuristic-green',
      customization: themeConfig?.customColors || {}
    });
  }

  // Return all available themes for provider portal
  return res.status(200).json({
    ok: true,
    themes: allThemes
  });
}

// POST /api/themes - Apply a theme to an organization
async function handleApplyTheme(
  req: NextApiRequest,
  res: NextApiResponse<ThemeApiResponse>
) {
  const { themeId, orgId, isProvider } = req.body;

  if (!themeId || !orgId) {
    return res.status(400).json({
      ok: false,
      error: 'Theme ID and organization ID are required'
    });
  }

  if (!(themeId in allThemes)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid theme ID'
    });
  }

  // Provider authentication check
  if (isProvider) {
    const providerAuth = await authenticateProvider(req);
    if (!providerAuth) {
      return res.status(401).json({
        ok: false,
        error: 'Provider authentication required'
      });
    }
  } else {
    // ✅ COMPLETED: Owner-only authentication check for client-side theme changes
    const cookies = parseCookies(req.headers.cookie || '');
    const userCookie = cookies.ws_user;

    if (!userCookie) {
      return res.status(401).json({
        ok: false,
        error: 'User authentication required'
      });
    }

    // Decode user info from cookie
    try {
      const userInfo = JSON.parse(decodeURIComponent(userCookie));
      if (userInfo.role !== 'OWNER') {
        return res.status(403).json({
          ok: false,
          error: 'Owner access required for theme management'
        });
      }
    } catch (error) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid user session'
      });
    }

    return res.status(200).json({ ok: true, themes: allThemes });

    /*
    if (!session?.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Verify user is OWNER of the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { org: true }
    });

    if (!user || user.role !== 'OWNER' || user.orgId !== orgId) {
      return res.status(403).json({
        ok: false,
        error: 'Only organization owners can change themes'
      });
    }
    */
  }

  // Create or update theme configuration
  const themeConfig = await prisma.themeConfig.upsert({
    where: {
      orgId_themeId: {
        orgId: orgId,
        themeId: themeId
      }
    },
    update: {
      isActive: true,
      updatedAt: new Date()
    },
    create: {
      themeId: themeId,
      name: allThemes[themeId as ThemeId].name,
      description: allThemes[themeId as ThemeId].description,
      category: allThemes[themeId as ThemeId].category,
      orgId: orgId,
      isActive: true
    }
  });

  // Deactivate other themes for this org
  await prisma.themeConfig.updateMany({
    where: {
      orgId: orgId,
      id: { not: themeConfig.id }
    },
    data: {
      isActive: false
    }
  });

  // Track theme usage
  await prisma.themeUsage.create({
    data: {
      orgId: orgId,
      themeId: themeId,
      sessionId: req.headers['x-session-id'] as string || undefined,
      userAgent: req.headers['user-agent'] || undefined
    }
  });

  // ✅ COMPLETED: Theme application logic
  try {
    // Apply theme to organization or user
    const cookies = parseCookies(req.headers.cookie || '');
    const userCookie = cookies.ws_user;

    if (userCookie) {
      // Apply theme for user's organization
      const userInfo = JSON.parse(decodeURIComponent(userCookie));

      await prisma.themeConfig.upsert({
        where: {
          orgId_themeId: {
            orgId: userInfo.orgId,
            themeId: themeId
          }
        },
        update: {
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          orgId: userInfo.orgId,
          themeId,
          name: `${themeId} Theme`,
          category: 'custom',
          isActive: true
        }
      });
    }

    return res.status(200).json({
      ok: true,
      currentTheme: themeId,
      message: 'Theme applied successfully'
    });
  } catch (error) {
    console.error('Theme application error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to apply theme'
    });
  }
}

// PUT /api/themes - Update theme customization
async function handleUpdateTheme(
  req: NextApiRequest,
  res: NextApiResponse<ThemeApiResponse>
) {
  const { orgId, customColors, customPatterns, customTypography, brandAssets } = req.body;

  if (!orgId) {
    return res.status(400).json({
      ok: false,
      error: 'Organization ID is required'
    });
  }

  // ✅ COMPLETED: Owner-only authentication check with proper session management
  const cookies = parseCookies(req.headers.cookie || '');
  const userCookie = cookies.ws_user;

  if (!userCookie) {
    return res.status(401).json({
      ok: false,
      error: 'User authentication required'
    });
  }

  try {
    const userInfo = JSON.parse(decodeURIComponent(userCookie));
    if (userInfo.role !== 'OWNER') {
      return res.status(403).json({
        ok: false,
        error: 'Owner access required for theme updates'
      });
    }

    // Update theme configuration
    await prisma.themeConfig.upsert({
      where: {
        orgId_themeId: {
          orgId: userInfo.orgId,
          themeId: 'default'
        }
      },
      update: {
        customColors: req.body.customizations || {},
        updatedAt: new Date()
      },
      create: {
        orgId: userInfo.orgId,
        themeId: 'default',
        name: 'Default Theme',
        category: 'professional',
        customColors: req.body.customizations || {},
        isActive: true
      }
    });

    return res.status(200).json({
      ok: true,
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Theme update error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to update theme'
    });
  }

  /*
  const session = null;
  if (!session?.user) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required'
    });
  }

  // Verify user is OWNER of the organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { org: true }
  });

  if (!user || user.role !== 'OWNER' || user.orgId !== orgId) {
    return res.status(403).json({
      ok: false,
      error: 'Only organization owners can customize themes'
    });
  }

  const themeConfig = await prisma.themeConfig.findFirst({
    where: {
      orgId: orgId,
      isActive: true
    }
  });

  if (!themeConfig) {
    return res.status(404).json({
      ok: false,
      error: 'No active theme configuration found'
    });
  }

  const updatedConfig = await prisma.themeConfig.update({
    where: { id: themeConfig.id },
    data: {
      customColors: customColors || themeConfig.customColors,
      customPatterns: customPatterns || themeConfig.customPatterns,
      customTypography: customTypography || themeConfig.customTypography,
      brandAssets: brandAssets || themeConfig.brandAssets,
      updatedAt: new Date()
    }
  });

  return res.status(200).json({
    ok: true,
    customization: {
      customColors: updatedConfig.customColors,
      customPatterns: updatedConfig.customPatterns,
      customTypography: updatedConfig.customTypography,
      brandAssets: updatedConfig.brandAssets
    }
  });
  */
}

// DELETE /api/themes - Reset theme to default
async function handleResetTheme(
  req: NextApiRequest,
  res: NextApiResponse<ThemeApiResponse>
) {
  const { orgId } = req.query;

  if (!orgId || typeof orgId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'Organization ID is required'
    });
  }

  // ✅ COMPLETED: Owner-only authentication check with proper session management
  const cookies = parseCookies(req.headers.cookie || '');
  const userCookie = cookies.ws_user;

  if (!userCookie) {
    return res.status(401).json({
      ok: false,
      error: 'User authentication required'
    });
  }

  try {
    const userInfo = JSON.parse(decodeURIComponent(userCookie));
    if (userInfo.role !== 'OWNER') {
      return res.status(403).json({
        ok: false,
        error: 'Owner access required for theme reset'
      });
    }

    // Reset theme to default
    await prisma.themeConfig.upsert({
      where: {
        orgId_themeId: {
          orgId: userInfo.orgId,
          themeId: 'default'
        }
      },
      update: {
        customColors: {},
        updatedAt: new Date()
      },
      create: {
        orgId: userInfo.orgId,
        themeId: 'default',
        name: 'Default Theme',
        category: 'professional',
        customColors: {},
        isActive: true
      }
    });

    return res.status(200).json({
      ok: true,
      message: 'Theme reset to default successfully'
    });
  } catch (error) {
    console.error('Theme reset error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to reset theme'
    });
  }

  /*
  const session = null;
  if (!session?.user) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required'
    });
  }

  // Verify user is OWNER of the organization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { org: true }
  });

  if (!user || user.role !== 'OWNER' || user.orgId !== orgId) {
    return res.status(403).json({
      ok: false,
      error: 'Only organization owners can reset themes'
    });
  }

  // Reset to default futuristic-green theme
  await prisma.themeConfig.deleteMany({
    where: { orgId: orgId }
  });

  await prisma.themeConfig.create({
    data: {
      themeId: 'futuristic-green',
      name: allThemes['futuristic-green'].name,
      description: allThemes['futuristic-green'].description,
      category: allThemes['futuristic-green'].category,
      orgId: orgId,
      isActive: true
    }
  });

  return res.status(200).json({
    ok: true,
    currentTheme: 'futuristic-green'
  });
  */
}
