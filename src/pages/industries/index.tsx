// src/pages/industries/index.tsx

/**
 * 🏭 MULTI-INDUSTRY PLATFORM SELECTOR
 * 
 * Industry-specific customization system for lead generation, job management,
 * contract management, bidding systems, and intuitive inventory management
 * across multiple service industries.
 * 
 * FEATURES:
 * - Industry-specific templates and workflows
 * - Customized lead generation systems
 * - Specialized job management tools
 * - Industry-tailored contract management
 * - Bidding and proposal systems
 * - Inventory management for service industries
 * - Compliance and regulatory features
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/AppShell';
import { 
  WrenchScrewdriverIcon,
  HomeIcon,
  TruckIcon,
  BuildingOfficeIcon,
  HeartIcon,
  AcademicCapIcon,
  ShoppingBagIcon,
  CogIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Industry {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  specializations: string[];
  color: string;
  gradient: string;
  isPopular?: boolean;
  comingSoon?: boolean;
}

const industries: Industry[] = [
  {
    id: 'hvac',
    name: 'HVAC Services',
    description: 'Heating, ventilation, air conditioning, and refrigeration services',
    icon: CogIcon,
    features: [
      'Seasonal maintenance scheduling',
      'Equipment inventory tracking',
      'Emergency service dispatch',
      'Energy efficiency reporting',
      'Warranty management'
    ],
    specializations: [
      'Residential HVAC',
      'Commercial HVAC',
      'Industrial Systems',
      'Refrigeration',
      'Ductwork'
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    isPopular: true
  },
  {
    id: 'plumbing',
    name: 'Plumbing Services',
    description: 'Residential and commercial plumbing installation and repair',
    icon: WrenchScrewdriverIcon,
    features: [
      'Emergency call management',
      'Pipe and fixture inventory',
      'Water damage assessment',
      'Permit tracking',
      'Inspection scheduling'
    ],
    specializations: [
      'Residential Plumbing',
      'Commercial Plumbing',
      'Drain Cleaning',
      'Water Heaters',
      'Pipe Installation'
    ],
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
    isPopular: true
  },
  {
    id: 'electrical',
    name: 'Electrical Services',
    description: 'Electrical installation, maintenance, and repair services',
    icon: BuildingOfficeIcon,
    features: [
      'Safety compliance tracking',
      'Electrical component inventory',
      'Code compliance management',
      'Load calculation tools',
      'Inspection coordination'
    ],
    specializations: [
      'Residential Electrical',
      'Commercial Electrical',
      'Industrial Electrical',
      'Solar Installation',
      'Smart Home Systems'
    ],
    color: 'yellow',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'construction',
    name: 'Construction & Contracting',
    description: 'General contracting and construction project management',
    icon: HomeIcon,
    features: [
      'Project timeline management',
      'Material procurement tracking',
      'Subcontractor coordination',
      'Progress photo documentation',
      'Change order management'
    ],
    specializations: [
      'General Contracting',
      'Home Renovation',
      'Commercial Construction',
      'Roofing',
      'Flooring'
    ],
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    isPopular: true
  },
  {
    id: 'landscaping',
    name: 'Landscaping & Lawn Care',
    description: 'Landscape design, installation, and maintenance services',
    icon: HomeIcon,
    features: [
      'Seasonal service scheduling',
      'Plant and material inventory',
      'Weather-based scheduling',
      'Before/after photo tracking',
      'Irrigation system management'
    ],
    specializations: [
      'Lawn Maintenance',
      'Landscape Design',
      'Tree Services',
      'Irrigation',
      'Hardscaping'
    ],
    color: 'green',
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'cleaning',
    name: 'Cleaning Services',
    description: 'Residential and commercial cleaning services',
    icon: ShoppingBagIcon,
    features: [
      'Recurring service scheduling',
      'Supply inventory management',
      'Quality inspection checklists',
      'Team assignment optimization',
      'Customer preference tracking'
    ],
    specializations: [
      'Residential Cleaning',
      'Commercial Cleaning',
      'Deep Cleaning',
      'Carpet Cleaning',
      'Window Cleaning'
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'automotive',
    name: 'Automotive Services',
    description: 'Auto repair, maintenance, and detailing services',
    icon: TruckIcon,
    features: [
      'Vehicle history tracking',
      'Parts inventory management',
      'Service reminder automation',
      'Diagnostic report generation',
      'Warranty claim processing'
    ],
    specializations: [
      'Auto Repair',
      'Oil Changes',
      'Tire Services',
      'Auto Detailing',
      'Collision Repair'
    ],
    color: 'red',
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Services',
    description: 'Medical and healthcare service providers',
    icon: HeartIcon,
    features: [
      'Patient appointment scheduling',
      'Medical supply inventory',
      'Insurance verification',
      'Treatment plan tracking',
      'Compliance documentation'
    ],
    specializations: [
      'Primary Care',
      'Dental Services',
      'Physical Therapy',
      'Home Healthcare',
      'Medical Equipment'
    ],
    color: 'pink',
    gradient: 'from-pink-500 to-pink-600',
    comingSoon: true
  },
  {
    id: 'education',
    name: 'Educational Services',
    description: 'Tutoring, training, and educational service providers',
    icon: AcademicCapIcon,
    features: [
      'Student progress tracking',
      'Curriculum management',
      'Parent communication tools',
      'Resource library management',
      'Assessment tracking'
    ],
    specializations: [
      'Private Tutoring',
      'Test Preparation',
      'Language Learning',
      'Professional Training',
      'Online Education'
    ],
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    comingSoon: true
  }
];

export default function IndustrySelector() {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.specializations.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleIndustrySelect = (industryId: string) => {
    const industry = industries.find(i => i.id === industryId);
    if (industry?.comingSoon) {
      // Show coming soon message
      return;
    }
    
    setSelectedIndustry(industryId);
    // Navigate to industry-specific setup
    router.push(`/industries/${industryId}/setup`);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      orange: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      green: 'text-green-400 bg-green-500/20 border-green-500/30',
      purple: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      red: 'text-red-400 bg-red-500/20 border-red-500/30',
      pink: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
      indigo: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30'
    };
    return colorMap[color] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent mb-4">
              🏭 Multi-Industry Platform
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Choose your industry to access specialized tools and workflows
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-green-500/30 text-white rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
              />
            </div>
          </div>

          {/* Industry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredIndustries.map((industry) => (
              <div
                key={industry.id}
                className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8 hover:border-green-500/40 transition-all duration-300 cursor-pointer group ${
                  industry.comingSoon ? 'opacity-75' : ''
                }`}
                onClick={() => handleIndustrySelect(industry.id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-xl ${getColorClasses(industry.color)}`}>
                    <industry.icon className="h-8 w-8" />
                  </div>
                  <div className="flex space-x-2">
                    {industry.isPopular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        <StarIcon className="h-3 w-3 mr-1" />
                        Popular
                      </span>
                    )}
                    {industry.comingSoon && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{industry.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{industry.description}</p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-400 mb-3">Key Features</h4>
                  <div className="space-y-2">
                    {industry.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {industry.features.length > 3 && (
                      <div className="text-slate-400 text-xs">
                        +{industry.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Specializations */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-400 mb-3">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.specializations.slice(0, 3).map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600"
                      >
                        {spec}
                      </span>
                    ))}
                    {industry.specializations.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                        +{industry.specializations.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-xs">
                    {industry.comingSoon ? 'Available Soon' : 'Ready to Configure'}
                  </div>
                  <div className="flex items-center space-x-2 text-green-400 group-hover:text-green-300 transition-colors">
                    <span className="text-sm font-medium">
                      {industry.comingSoon ? 'Notify Me' : 'Get Started'}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
              <h3 className="text-lg font-semibold text-white mb-2">Don't See Your Industry?</h3>
              <p className="text-slate-400 mb-4">
                We're constantly adding new industry-specific features and workflows.
              </p>
              <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300">
                Request Custom Industry
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
