"use client";
import { useState, useEffect } from "react";
import { Package, CheckCircle2, Zap } from "lucide-react";

export function VerticalPackClient({ orgId }: { orgId: string }) {
  const [verticalPacks, setVerticalPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vertical-packs")
      .then((r) => r.json())
      .then((d) => {
        setVerticalPacks(d.verticalPacks || []);
        setLoading(false);
      });
  }, []);

  const togglePack = async (id: string, currentActive: boolean) => {
    await fetch("/api/vertical-packs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !currentActive }),
    });
    setVerticalPacks((prev) =>
      prev.map((vp) => (vp.id === id ? { ...vp, active: !currentActive } : vp)),
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  const categories = [...new Set(verticalPacks.map((vp) => vp.category))];
  const activeCount = verticalPacks.filter((vp) => vp.active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Industry Configuration
          </h1>
          <p className="text-gray-600 mt-1">
            Select and configure industry-specific features
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Active Vertical Packs: {activeCount}
              </p>
              <p className="text-sm text-blue-700">
                Customize your platform for your specific industry
              </p>
            </div>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verticalPacks
                .filter((vp) => vp.category === category)
                .map((vp) => (
                  <div
                    key={vp.id}
                    className={`bg-white rounded-lg border-2 transition-colors ${vp.active ? "border-blue-500" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{vp.icon}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {vp.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {vp.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => togglePack(vp.id, vp.active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${vp.active ? "bg-blue-600" : "bg-gray-200"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${vp.active ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                      </div>

                      {vp.active && (
                        <>
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              FEATURES
                            </p>
                            <ul className="space-y-1">
                              {vp.features.map((feature: string) => (
                                <li
                                  key={feature}
                                  className="flex items-center gap-2 text-sm text-gray-600"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-4 border-t">
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              CUSTOM FIELDS
                            </p>
                            <div className="space-y-2">
                              {vp.customFields.map(
                                (field: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {field.type}
                                    </span>
                                    <span className="text-gray-900">
                                      {field.name}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* PHASE 2: Stub implementation (blocked by dependencies)
            Blocked by:
            - [prisma_model] ProviderConfig.featureFlags / VerticalPack
            - [feature] dynamic schema updates per pack
            - [feature] workflow customization engine
        */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">
                📌 Phase 2: Stub implementation
              </p>
              <p>
                Uses placeholder data. Blocked by feature flag-backed pack
                models, dynamic schema updates, and workflow customization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
