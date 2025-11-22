
import React, { useState, useEffect } from 'react';
import { User, Hub, UserRole, ProductType } from '../types';
import { store } from '../services/mockStore';
import { Users, Building, Plus, Search, Edit2, X, Save, MapPin, Mail, Tag, Briefcase, Trash2, AlertCircle } from 'lucide-react';

export const MasterManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'hubs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const refreshData = () => {
    setUsers(store.getUsers());
    setHubs(store.getHubs());
  };

  useEffect(() => { refreshData(); }, []);

  const handleSaveUser = () => {
      if (!formData.name || !formData.email || !formData.role) return;

      // Parse Advocate specific arrays
      const statesArray = formData.states ? (typeof formData.states === 'string' ? formData.states.split(',').map((s: string) => s.trim()) : formData.states) : undefined;
      const districtsArray = formData.districts ? (typeof formData.districts === 'string' ? formData.districts.split(',').map((s: string) => s.trim()) : formData.districts) : undefined;
      const tagsArray = formData.tags ? (typeof formData.tags === 'string' ? formData.tags.split(',').map((s: string) => s.trim()) : formData.tags) : undefined;

      const userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          // Bank User Fields
          hubId: formData.role === UserRole.BANK_USER ? formData.hubId : undefined,
          // Advocate Fields
          firmName: formData.role === UserRole.ADVOCATE ? formData.firmName : undefined,
          states: statesArray,
          districts: districtsArray,
          expertise: formData.role === UserRole.ADVOCATE ? formData.expertise : undefined, // Array of ProductTypes
          tags: tagsArray,
      };

      if (editingItem) {
          store.updateUser({ ...editingItem, ...userData });
      } else {
          store.addUser(userData);
      }
      setShowUserModal(false); setEditingItem(null); setFormData({}); refreshData();
  };

  const handleDeleteUser = (id: string) => {
      if(window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          try {
              store.deleteUser(id);
              refreshData();
          } catch (e) {
              alert((e as Error).message);
          }
      }
  };

  const handleSaveHub = () => {
      if (!formData.name || !formData.code || !formData.district) return;
      const hubData = { 
          code: formData.code, 
          name: formData.name, 
          email: formData.email, 
          state: formData.state, 
          district: formData.district 
      };
      if (editingItem) {
          store.updateHub({ ...editingItem, ...hubData });
      } else {
          store.addHub(hubData);
      }
      setShowHubModal(false); setEditingItem(null); setFormData({}); refreshData();
  };

  const handleDeleteHub = (id: string) => {
      if(window.confirm("Are you sure you want to delete this hub? Users mapped to this hub must be reassigned first.")) {
          try {
              store.deleteHub(id);
              refreshData();
          } catch(e) {
              alert((e as Error).message);
          }
      }
  };

  const openUserModal = (user?: User) => {
      setEditingItem(user || null);
      setFormData(user ? { 
          ...user, 
          states: user.states?.join(', '), 
          districts: user.districts?.join(', '),
          tags: user.tags?.join(', '),
          expertise: user.expertise || []
      } : { role: UserRole.BANK_USER, expertise: [] });
      setShowUserModal(true);
  };

  const openHubModal = (hub?: Hub) => {
      setEditingItem(hub || null);
      setFormData(hub ? { ...hub } : {});
      setShowHubModal(true);
  };

  const toggleExpertise = (type: ProductType) => {
      const current = formData.expertise || [];
      if (current.includes(type)) {
          setFormData({ ...formData, expertise: current.filter((t: string) => t !== type) });
      } else {
          setFormData({ ...formData, expertise: [...current, type] });
      }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Master Management</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 flex">
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-slate-50 text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}><Users className="w-4 h-4" /> User Management</button>
            <button onClick={() => setActiveTab('hubs')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'hubs' ? 'bg-slate-50 text-brand-600 border-b-2 border-brand-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}><Building className="w-4 h-4" /> Hub Configuration</button>
        </div>

        <div className="p-8">
            {activeTab === 'users' && (
                <div>
                    <div className="flex justify-between items-center mb-6 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                        </div>
                        <button onClick={() => openUserModal()} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-md ml-auto"><Plus className="w-4 h-4" /> Add User</button>
                    </div>
                    <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name / Firm</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Hub</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details / Coverage</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {users.map(u => {
                                    const hub = hubs.find(h => h.id === u.hubId);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-900">{u.firmName || u.name}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${u.role === UserRole.ADVOCATE ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>{u.role.replace('_', ' ')}</span>
                                                    {u.role === UserRole.BANK_USER && hub && (
                                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Building className="w-3 h-3" /> {hub.code}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {u.role === UserRole.ADVOCATE ? (
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap gap-1">
                                                            {u.states?.map(s => <span key={s} className="text-[10px] border border-slate-200 px-1.5 rounded bg-white">{s}</span>)}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {u.tags?.slice(0,2).map(t => <span key={t} className="bg-brand-50 text-brand-700 text-[10px] px-1.5 py-0.5 rounded border border-brand-100">{t}</span>)}
                                                            {(u.tags?.length || 0) > 2 && <span className="text-[10px] text-slate-400">+{u.tags!.length - 2} more</span>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openUserModal(u)} className="p-2 text-slate-400 hover:text-brand-600 rounded-lg transition-colors" title="Edit User"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {activeTab === 'hubs' && (
                <div>
                    <div className="flex justify-between items-center mb-6 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Search hubs..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                        </div>
                         <button onClick={() => openHubModal()} className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-md ml-auto"><Plus className="w-4 h-4" /> Add Hub</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hubs.map(h => (
                            <div key={h.id} className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition-all group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold font-mono border border-slate-200">{h.code}</div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openHubModal(h)} className="text-slate-400 hover:text-brand-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors" title="Edit Hub"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteHub(h.id)} className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Hub"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">{h.name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mb-4"><MapPin className="w-3.5 h-3.5" /> {h.district}, {h.state}</p>
                                <div className="pt-3 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Report Delivery Email</label>
                                    <div className="flex items-center gap-2 text-sm text-brand-700 font-medium bg-brand-50 px-3 py-2 rounded-lg border border-brand-100">
                                        <Mail className="w-3.5 h-3.5 shrink-0" /> 
                                        <span className="truncate">{h.email}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* USER MODAL */}
      {showUserModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-slate-900">{editingItem ? 'Edit User' : 'Add New User'}</h3>
                      <button onClick={() => setShowUserModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
                  </div>
                  <div className="p-8 space-y-5 overflow-y-auto">
                      {/* Common Fields */}
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Role</label>
                            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none">
                                    <option value={UserRole.BANK_USER}>Bank User</option>
                                    <option value={UserRole.ADVOCATE}>Advocate</option>
                                    <option value={UserRole.CT_OPS}>Ops User</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Full Name / Contact Person</label>
                            <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none" placeholder="e.g. John Doe" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                            <input type="email" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none" placeholder="e.g. john@company.com" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                      </div>

                      {/* Bank User Specific */}
                      {formData.role === UserRole.BANK_USER && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><Building className="w-3.5 h-3.5" /> Hub Mapping</label>
                              <select value={formData.hubId || ''} onChange={(e) => setFormData({...formData, hubId: e.target.value})} className="w-full border-slate-200 bg-white rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 outline-none">
                                  <option value="">Select a Hub</option>
                                  {hubs.map(h => (
                                      <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                                  ))}
                              </select>
                              <p className="text-[10px] text-slate-400 mt-1.5">This user will claim assignments linked to this hub.</p>
                          </div>
                      )}

                      {/* Advocate Specific */}
                      {formData.role === UserRole.ADVOCATE && (
                          <div className="space-y-5 pt-2 border-t border-slate-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Firm Name</label>
                                <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.firmName || ''} onChange={(e) => setFormData({...formData, firmName: e.target.value})} placeholder="Legal Entity Name" />
                            </div>
                            
                            {/* Expertise Checkboxes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Product Expertise</label>
                                <div className="flex gap-3 flex-wrap">
                                    {[ProductType.HL, ProductType.LAP, ProductType.BL].map(type => (
                                        <label key={type} className={`cursor-pointer px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${formData.expertise?.includes(type) ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.expertise?.includes(type)} onChange={() => toggleExpertise(type)} />
                                            {formData.expertise?.includes(type) && <span className="w-2 h-2 rounded-full bg-brand-600"></span>}
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> States</label>
                                    <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.states || ''} onChange={(e) => setFormData({...formData, states: e.target.value})} placeholder="e.g. Maharashtra, Delhi" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Districts</label>
                                    <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.districts || ''} onChange={(e) => setFormData({...formData, districts: e.target.value})} placeholder="e.g. Mumbai, Pune" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> AI Allocation Tags</label>
                                <input type="text" placeholder="e.g. Fast TAT, High Value, Litigation" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.tags || ''} onChange={(e) => setFormData({...formData, tags: e.target.value})} />
                                <p className="text-[10px] text-slate-400 mt-1.5">Comma separated tags used by the AI Genius to recommend this advocate.</p>
                            </div>
                          </div>
                      )}
                  </div>
                  <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setShowUserModal(false)} className="px-5 py-2.5 text-slate-600 text-sm font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                      <button onClick={handleSaveUser} className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 rounded-xl shadow-md transition-all">Save User</button>
                  </div>
              </div>
          </div>
      )}

      {/* HUB MODAL */}
      {showHubModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-900">{editingItem ? 'Edit Hub' : 'Add New Hub'}</h3>
                      <button onClick={() => setShowHubModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-700" /></button>
                  </div>
                  <div className="p-8 space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Hub Code</label>
                              <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="HUB-XXX-01" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Hub Name</label>
                              <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mumbai Central" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">Hub Email <AlertCircle className="w-3 h-3 text-brand-500" /></label>
                          <input type="email" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="hub@company.com" />
                          <p className="text-[10px] text-brand-600 font-medium mt-1.5">Critical: Final reports will be automatically sent to this email.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">State</label>
                              <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">District</label>
                              <input type="text" className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm py-2.5 px-3 focus:ring-2 focus:ring-brand-500/20 focus:bg-white outline-none" value={formData.district || ''} onChange={(e) => setFormData({...formData, district: e.target.value})} />
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
                      <button onClick={() => setShowHubModal(false)} className="px-5 py-2.5 text-slate-600 text-sm font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                      <button onClick={handleSaveHub} className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 rounded-xl shadow-md transition-all">Save Hub</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
