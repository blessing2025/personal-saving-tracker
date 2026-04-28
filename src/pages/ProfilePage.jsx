import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Camera, 
  CheckCircle2, 
  BadgeCheck, 
  Sparkles,
  Smartphone, 
  Laptop as LaptopIcon,
  MapPin,
  Phone,
  Lock,
  Verified,
  Eye,
  EyeOff,
} from 'lucide-react';
import { db } from '../lib/db';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function ProfilePage() {
  const { t, profile } = useTranslation();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile && !isInitialized) {
      setFullName(profile.full_name || '');
      setDisplayName(profile.display_name || '');
      setPhoneNumber(profile.phone_number || '');
      setLocation(profile.location || '');
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  // Calculate Profile Strength (basic logic)
  const fields = [fullName, profile?.avatar_url, phoneNumber, location, displayName, user?.email];
  const strength = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await db.profiles.put({
        ...profile,
        id: user.id,
        full_name: fullName,
        display_name: displayName,
        phone_number: phoneNumber,
        location: location,
        synced_at: null
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error(t('currentPasswordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    try {
      // Verify current password by attempting a re-authentication
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) throw new Error(t('invalidCurrentPassword'));

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          await db.profiles.put({
            ...profile,
            id: user.id,
            avatar_url: base64String,
            synced_at: null
          });
          toast.success('Profile picture updated!');
        } catch (err) {
          toast.error('Failed to update profile picture.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto space-y-12">
      {/* Header Section */}
      <header>
        <h1 className="text-5xl font-extrabold text-indigo-900 dark:text-white tracking-tighter mb-2 font-headline">
          {t('profileManagement') || 'Profile Management'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Update your professional identity and security settings at the personal saving tracker.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Summary (4/12) */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex flex-col items-center text-center border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative mb-6">
              <div className="h-32 w-32 rounded-full ring-4 ring-indigo-100 dark:ring-indigo-900/50 p-1">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2.5 rounded-full shadow-lg border-4 border-white dark:border-slate-800 transition-transform hover:scale-110 active:scale-95"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-headline">
              {fullName || user?.email?.split('@')[0]}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('privateWealthClient') || 'Private Wealth Client'}</p>
            
            <div className="w-full space-y-3 pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{t('profileStrength')}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{strength}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${strength}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 dark:bg-indigo-700 p-8 rounded-2xl text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 mb-2">{t('memberSince')}</h4>
            <p className="text-2xl font-bold mb-8 font-headline">October 2022</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Verified size={18} className="text-indigo-200" />
                <span className="text-sm font-medium">{t('kycVerified')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-indigo-200" />
                <span className="text-sm font-medium">{t('premiumTierBenefits')}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Forms (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Details Card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-headline">{t('personalDetails')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('identityEncrypted') || 'Your identity information is encrypted and secure.'}</p>
              </div>
              <BadgeCheck size={32} className="text-indigo-600/30" />
            </div>
            
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('fullName')}</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('displayName')}</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                <div className="relative">
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-5 py-4 text-slate-400 font-bold outline-none cursor-not-allowed" 
                    readOnly 
                    value={user?.email} 
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-[10px] uppercase flex items-center gap-1">
                    <CheckCircle2 size={14} /> {t('verified')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('phoneNumber')}</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('location')}</label>
                  <input 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-indigo-600 text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </section>

          {/* Security & Password Card */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-headline">{t('securityPassword')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('manageCredentials') || 'Manage your credentials and authentication methods.'}</p>
              </div>
              <ShieldCheck size={32} className="text-indigo-600/30" />
            </div>
            
            <div className="space-y-8">
              <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('currentPassword')}</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('newPassword')}</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('confirmPassword')}</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold outline-none" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleUpdatePassword}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-sm"
                >
                  {t('updatePassword')}
                </button>
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}