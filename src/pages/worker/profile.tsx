// src/pages/worker/profile.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  startDate: Date;
  position: string;
  department: string;
  supervisor: string;
  employeeId: string;
}

/**
 * Employee Profile Management
 * Mobile-first PWA design for field workers
 * Features: Personal info, emergency contacts, employment details, profile updates
 */
export default function WorkerProfile() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmployeeProfile>>({});

  // Redirect non-STAFF users
  useEffect(() => {
    if (!loading && me && me.role !== "STAFF") {
      router.push("/dashboard");
    }
  }, [me, loading, router]);

  // TODO: Load employee profile from API
  useEffect(() => {
    if (me && me.role === "STAFF") {
      loadEmployeeProfile();
    }
  }, [me]);

  const loadEmployeeProfile = async () => {
    try {
      // Mock data for now - will integrate with actual API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockProfile: EmployeeProfile = {
        id: '1',
        firstName: 'John',
        lastName: 'Worker',
        email: me?.email || 'john.worker@example.com',
        phone: '(555) 123-4567',
        address: {
          street: '123 Main Street',
          city: 'Denver',
          state: 'CO',
          zipCode: '80202'
        },
        emergencyContact: {
          name: 'Jane Worker',
          relationship: 'Spouse',
          phone: '(555) 987-6543'
        },
        startDate: new Date('2023-03-15'),
        position: 'Cleaning Technician',
        department: 'Field Operations',
        supervisor: 'Sarah Manager',
        employeeId: 'EMP001'
      };
      
      setProfile(mockProfile);
      setEditForm(mockProfile);
    } catch (error) {
      console.error('Failed to load employee profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !editForm) return;
    
    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/worker/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editForm)
      // });

      // Mock API response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile({ ...profile, ...editForm } as EmployeeProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm(profile);
    }
    setIsEditing(false);
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !me || me.role !== "STAFF" || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Employee access required</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">My Profile</h1>
          <p className="text-blue-100 text-sm">
            Employee ID: {profile.employeeId}
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white font-bold">
                {profile.firstName[0]}{profile.lastName[0]}
              </span>
            </div>
            <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
            <p className="text-gray-600">{profile.position}</p>
            <p className="text-sm text-gray-500">{profile.department}</p>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Personal Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={editForm.address?.street || ''}
                    onChange={(e) => setEditForm({...editForm, address: {...(editForm.address || profile.address), street: e.target.value}})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.address?.city || ''}
                      onChange={(e) => setEditForm({...editForm, address: {...(editForm.address || profile.address), city: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={editForm.address?.zipCode || ''}
                      onChange={(e) => setEditForm({...editForm, address: {...(editForm.address || profile.address), zipCode: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span>{profile.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="text-right">
                    {profile.address.street}<br />
                    {profile.address.city}, {profile.address.state} {profile.address.zipCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Emergency Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{profile.emergencyContact.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Relationship:</span>
                <span>{profile.emergencyContact.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{profile.emergencyContact.phone}</span>
              </div>
            </div>
            <button className="mt-3 text-blue-500 underline text-sm">
              Update Emergency Contact
            </button>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Employment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span>{profile.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span>{profile.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span>{profile.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supervisor:</span>
                <span>{profile.supervisor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Years of Service:</span>
                <span>
                  {Math.floor((Date.now() - profile.startDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                </span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Account Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 rounded font-medium transition-colors text-left">
                🔐 Change Password
              </button>
              <button className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 px-4 rounded font-medium transition-colors text-left">
                📱 App Preferences
              </button>
              <button className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 px-4 rounded font-medium transition-colors text-left">
                📧 Notification Settings
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link href="/worker/home" className="text-blue-500 underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}