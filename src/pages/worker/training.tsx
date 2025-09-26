// src/pages/worker/training.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'procedures' | 'compliance' | 'skills';
  duration: number; // minutes
  isRequired: boolean;
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  progress: number; // percentage
}

/**
 * Employee Training Portal
 * Mobile-first PWA design for field workers
 * Features: Training modules, progress tracking, certification status
 */
export default function WorkerTraining() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  // Redirect non-STAFF users (temporarily disabled for testing)
  // useEffect(() => {
  //   if (!loading && me && me.role !== "STAFF") {
  //     router.push("/dashboard");
  //   }
  // }, [me, loading, router]);

  // TODO: Load training modules from API
  useEffect(() => {
    if (me && me.role === "STAFF") {
      loadTrainingModules();
    }
  }, [me]);

  const loadTrainingModules = async () => {
    try {
      // Mock data for now - will integrate with actual API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockModules: TrainingModule[] = [
        {
          id: '1',
          title: 'Workplace Safety Fundamentals',
          description: 'Essential safety protocols and procedures for cleaning operations',
          category: 'safety',
          duration: 45,
          isRequired: true,
          completed: true,
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          progress: 100
        },
        {
          id: '2',
          title: 'Chemical Handling & MSDS',
          description: 'Safe handling procedures for cleaning chemicals and understanding Material Safety Data Sheets',
          category: 'safety',
          duration: 60,
          isRequired: true,
          completed: false,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          progress: 75
        },
        {
          id: '3',
          title: 'Customer Service Excellence',
          description: 'Building positive relationships with clients and handling customer interactions',
          category: 'skills',
          duration: 30,
          isRequired: false,
          completed: false,
          progress: 0
        },
        {
          id: '4',
          title: 'Equipment Operation & Maintenance',
          description: 'Proper use and care of cleaning equipment and tools',
          category: 'procedures',
          duration: 90,
          isRequired: true,
          completed: false,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          progress: 25
        },
        {
          id: '5',
          title: 'OSHA Compliance Training',
          description: 'Understanding OSHA regulations and compliance requirements',
          category: 'compliance',
          duration: 120,
          isRequired: true,
          completed: false,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          progress: 0
        }
      ];
      
      setModules(mockModules);
    } catch (error) {
      console.error('Failed to load training modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const getCategoryColor = (category: TrainingModule['category']) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'procedures': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'compliance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'skills': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: TrainingModule['category']) => {
    switch (category) {
      case 'safety': return '⚠️';
      case 'procedures': return '📋';
      case 'compliance': return '📜';
      case 'skills': return '🎯';
      default: return '📚';
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const diffTime = dueDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading || loadingModules) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Role check temporarily disabled for testing
  // if (error || !me || me.role !== "STAFF") {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center p-4">
  //       <div className="text-center">
  //         <p className="text-red-500 mb-4">Employee access required</p>
  //         <Link href="/login" className="btn-primary">
  //           Sign In
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  const requiredModules = modules.filter(m => m.isRequired);
  const completedRequired = requiredModules.filter(m => m.completed).length;
  const totalRequired = requiredModules.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Training</h1>
          <p className="text-purple-100 text-sm">
            {modules.length} modules • {completedRequired}/{totalRequired} required completed
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {/* Progress Summary */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Completion Progress</h3>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Required Training</span>
                <span>{completedRequired}/{totalRequired}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Training Modules */}
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="bg-white rounded-lg shadow-lg p-4">
                {/* Module Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(module.category)}</span>
                      <h3 className="font-semibold">{module.title}</h3>
                      {module.isRequired && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(module.category)}`}>
                      {module.category}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${module.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Module Details */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>📊 {module.duration} minutes</span>
                  {module.completed ? (
                    <span className="text-green-600 font-medium">
                      ✅ Completed {module.completedAt?.toLocaleDateString()}
                    </span>
                  ) : module.dueDate ? (
                    <span className={`font-medium ${getDaysUntilDue(module.dueDate) <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                      Due in {getDaysUntilDue(module.dueDate)} days
                    </span>
                  ) : (
                    <span className="text-gray-500">No due date</span>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                    module.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : module.progress > 0
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                  onClick={() => router.push(`/worker/training/${module.id}`)}
                >
                  {module.completed ? 'Review Module' : module.progress > 0 ? 'Continue' : 'Start Training'}
                </button>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-6 text-center">
            <Link href="/worker/home" className="text-blue-500 underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}