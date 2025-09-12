"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Phone, Search, Plus, Calendar, MessageSquare, Trash2, AlertTriangle, Building2, MapPin, Target, Zap } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { EnhancedClientForm } from "./enhanced-form";

interface Client {
  _id: string;
  phoneNumber: string;
  status: string;
  notes: string;
  createdAt: string;
  lastCallDate?: string;
  mood?: string;
  sentiment?: number;
  // Enhanced fields
  name?: string;
  email?: string;
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    cuisineType?: string;
    establishmentSize?: string;
    yearsInBusiness?: number;
    monthlyRevenue?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  currentSolutions?: {
    hasExistingPOS?: boolean;
    posProvider?: string;
    hasKiosk?: boolean;
    hasNativeApp?: boolean;
    hasWebsite?: boolean;
    hasDeliveryIntegration?: boolean;
    hasOnlineOrdering?: boolean;
  };
  requirements?: {
    primaryGoals?: string[];
    painPoints?: string[];
    budgetRange?: string;
    timeline?: string;
    preferredContactMethod?: string;
  };
  competitiveInfo?: {
    isReceivingCompetitorCalls?: boolean;
    competitorNames?: string[];
  };
  leadQuality?: {
    leadScore?: number;
    leadSource?: string;
    isHotLead?: boolean;
    engagementLevel?: string;
    conversionProbability?: string;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    phoneNumber: "",
    status: "prospect",
    notes: "",
    name: "",
    email: "",
    // Enhanced fields
    businessInfo: {
      businessName: "",
      businessType: "",
      cuisineType: "",
      establishmentSize: "",
      yearsInBusiness: 0,
      monthlyRevenue: ""
    },
    location: {
      country: "",
      region: "",
      city: ""
    },
    currentSolutions: {
      hasExistingPOS: false,
      posProvider: "",
      hasKiosk: false,
      hasNativeApp: false,
      hasWebsite: false,
      hasDeliveryIntegration: false,
      hasOnlineOrdering: false
    },
    requirements: {
      primaryGoals: [] as string[],
      painPoints: [] as string[],
      budgetRange: "",
      timeline: "",
      preferredContactMethod: ""
    },
    competitiveInfo: {
      isReceivingCompetitorCalls: false,
      competitorNames: [] as string[]
    },
    leadQuality: {
      leadScore: 5,
      leadSource: "",
      isHotLead: false,
      engagementLevel: "",
      conversionProbability: ""
    }
  });
  const [showClearModal, setShowClearModal] = useState(false);
  const [clientToClear, setClientToClear] = useState<Client | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'solutions' | 'requirements' | 'competitive' | 'quality'>('basic');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      const data = await response.json();
      if (data.success) {
        setClients([...clients, data.data]);
        setNewClient({
          phoneNumber: "",
          status: "prospect",
          notes: "",
          name: "",
          email: "",
          businessInfo: {
            businessName: "",
            businessType: "",
            cuisineType: "",
            establishmentSize: "",
            yearsInBusiness: 0,
            monthlyRevenue: ""
          },
          location: {
            country: "",
            region: "",
            city: ""
          },
          currentSolutions: {
            hasExistingPOS: false,
            posProvider: "",
            hasKiosk: false,
            hasNativeApp: false,
            hasWebsite: false,
            hasDeliveryIntegration: false,
            hasOnlineOrdering: false
          },
          requirements: {
            primaryGoals: [],
            painPoints: [],
            budgetRange: "",
            timeline: "",
            preferredContactMethod: ""
          },
          competitiveInfo: {
            isReceivingCompetitorCalls: false,
            competitorNames: []
          },
          leadQuality: {
            leadScore: 5,
            leadSource: "",
            isHotLead: false,
            engagementLevel: "",
            conversionProbability: ""
          }
        });
        setActiveTab('basic');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleArrayInput = (field: string, value: string, action: 'add' | 'remove') => {
    const [parent, child] = field.split('.');
    setNewClient(prev => {
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [child]: action === 'add' 
            ? [...(parentObj[child] || []), value]
            : (parentObj[child] || []).filter((item: string) => item !== value)
        }
      };
    });
  };

  const handleEditArrayInput = (field: string, value: string, action: 'add' | 'remove') => {
    const [parent, child] = field.split('.');
    setEditingClient(prev => {
      if (!prev) return prev;
      const parentObj = prev[parent as keyof typeof prev] as any;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [child]: action === 'add' 
            ? [...(parentObj[child] || []), value]
            : (parentObj[child] || []).filter((item: string) => item !== value)
        }
      };
    });
  };

  const handleClientClick = (client: Client) => {
    router.push(`/clients/${client._id}`);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient({
      ...client,
      // Ensure all enhanced fields are present with defaults
      businessInfo: {
        businessName: "",
        businessType: "",
        cuisineType: "",
        establishmentSize: "",
        yearsInBusiness: 0,
        monthlyRevenue: "",
        ...client.businessInfo
      },
      location: {
        country: "",
        region: "",
        city: "",
        ...client.location
      },
      currentSolutions: {
        hasExistingPOS: false,
        posProvider: "",
        hasKiosk: false,
        hasNativeApp: false,
        hasWebsite: false,
        hasDeliveryIntegration: false,
        hasOnlineOrdering: false,
        ...client.currentSolutions
      },
      requirements: {
        primaryGoals: [],
        painPoints: [],
        budgetRange: "",
        timeline: "",
        preferredContactMethod: "",
        ...client.requirements
      },
      competitiveInfo: {
        isReceivingCompetitorCalls: false,
        competitorNames: [],
        ...client.competitiveInfo
      },
      leadQuality: {
        leadScore: 5,
        leadSource: "",
        isHotLead: false,
        engagementLevel: "",
        conversionProbability: "",
        ...client.leadQuality
      }
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      console.log('Updating client with data:', editingClient);
      const response = await fetch(`/api/clients/${editingClient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient)
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        setClients(clients.map(client => 
          client._id === editingClient._id ? editingClient : client
        ));
        setShowEditModal(false);
        setEditingClient(null);
        setActiveTab('basic');
        console.log('Client updated successfully');
      } else {
        console.error('Update failed:', data.error);
        alert('Failed to update client: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error updating client: ' + error);
    }
  };

  const handleClearData = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setClientToClear(client);
    setShowClearModal(true);
  };

  const confirmClearData = async () => {
    if (!clientToClear) return;
    
    try {
      setIsClearing(true);
      const response = await fetch(`/api/clients/${clientToClear._id}/clear-data`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove client from list
        setClients(prev => prev.filter(c => c._id !== clientToClear._id));
        setShowClearModal(false);
        setClientToClear(null);
        alert('Client data cleared successfully');
      } else {
        alert(data.error || 'Failed to clear client data');
      }
    } catch (error) {
      console.error('Error clearing client data:', error);
      alert('Error clearing client data');
    } finally {
      setIsClearing(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.phoneNumber.includes(searchTerm) ||
    client.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout currentScreen="clients">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Clients</h1>
              <p className="text-xl text-slate-600">Manage your client relationships</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients by phone, status, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client._id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.phoneNumber}</h3>
                    <p className="text-sm text-slate-600">Client ID: {client._id.slice(-8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Call</span>
                  <span className="text-sm text-slate-900">
                    {client.lastCallDate 
                      ? new Date(client.lastCallDate).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
                
                {client.mood && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Mood</span>
                    <span className={`text-sm font-medium ${getMoodColor(client.mood)}`}>
                      {client.mood}
                    </span>
                  </div>
                )}

                {client.sentiment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sentiment</span>
                    <span className="text-sm text-slate-900">
                      {(client.sentiment * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600 line-clamp-2">{client.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(client.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleEditClient(client)}
                    className="flex items-center px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="Edit client information"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleClearData(client, e)}
                    className="flex items-center px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Clear all client data"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Clear Data</span>
                  </button>
                  <button
                    onClick={() => handleClientClick(client)}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </button>
          </div>
        )}

        {/* Enhanced Add Client Modal */}
        {showAddModal && (
          <EnhancedClientForm
            newClient={newClient}
            setNewClient={setNewClient}
            handleAddClient={handleAddClient}
            setShowAddModal={setShowAddModal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleArrayInput={handleArrayInput}
          />
        )}

        {/* Enhanced Edit Client Modal */}
        {showEditModal && editingClient && (
          <EnhancedClientForm
            newClient={editingClient}
            setNewClient={setEditingClient}
            handleAddClient={handleUpdateClient}
            setShowAddModal={setShowEditModal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleArrayInput={handleEditArrayInput}
            isEditMode={true}
          />
        )}

        {/* Clear Data Confirmation Modal */}
        {showClearModal && clientToClear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Clear Client Data
                    </h3>
                    <p className="text-sm text-slate-600">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-slate-700 mb-3">
                    Are you sure you want to clear all data for client <strong>{clientToClear.phoneNumber}</strong>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium mb-1">This will permanently delete:</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>All call records and transcripts</li>
                      <li>AI suggestions and analysis</li>
                      <li>Client preferences and website data</li>
                      <li>All metrics and analytics</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowClearModal(false);
                      setClientToClear(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    disabled={isClearing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClearData}
                    disabled={isClearing}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isClearing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Clearing...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
