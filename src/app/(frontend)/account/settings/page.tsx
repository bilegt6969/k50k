'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/firebaseConfig'
import { User, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bell, Palette, Trash } from 'lucide-react' // Example icons
import { Skeleton } from '@heroui/skeleton' // Assuming component exists
import { Button } from '@/components/ui/button' // Assuming component exists
import { Switch } from '@/components/ui/switch' // Assuming you have a Switch component
import { Label } from '@/components/ui/label' // Assuming component exists
 
// Mock settings state (replace with fetching/saving from backend)
interface UserSettings {
  receiveNotifications: boolean;
  theme: 'dark' | 'light' | 'system';
}

const SettingsPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
     receiveNotifications: true, // Default values
     theme: 'dark',
  });
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // TODO: Fetch actual settings from your backend here
        // const fetchedSettings = await fetchUserSettings(currentUser.uid);
        // setSettings(fetchedSettings);
      } else {
        router.replace('/')
      }
       setLoading(false)
    })
    return () => unsubscribe()
  }, [router])


   // Mock function to save settings (replace with actual API call)
   const saveSettings = async (userId: string, newSettings: UserSettings): Promise<void> => {
     console.log(`Saving settings for user ${userId}:`, newSettings);
     setIsSaving(true);
     await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
     // Add actual API call here
     // Handle potential errors
     setIsSaving(false);
     alert('Тохиргоо хадгалагдлаа.'); // Replace with toast
     return Promise.resolve();
   };


   const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
       setSettings(prev => ({ ...prev, [key]: value }));
   };

   const handleSaveChanges = async () => {
       if (!user) return;
       await saveSettings(user.uid, settings);
   };


  if (loading) {
     return (
        <div className="fixed inset-0 overflow-y-auto bg-black min-h-screen text-white p-6">
            <div className="max-w-3xl mx-auto">
                 <Skeleton className="h-8 w-12 mb-8" /> {/* Back link */}
                 <Skeleton className="h-9 w-32 mb-2" /> {/* Title */}
                 <Skeleton className="h-6 w-56 mb-10" /> {/* Subtitle */}

                 {/* Settings Section Skeleton */}
                 <div className="bg-neutral-900/40 p-8 rounded-2xl border border-neutral-800/50 mb-8 space-y-6">
                    <div>
                       <Skeleton className="h-6 w-40 mb-3" />
                       <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-6 w-12 rounded-full" />
                       </div>
                    </div>
                     <div>
                       <Skeleton className="h-6 w-32 mb-3" />
                       <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-10 w-24 rounded-md" />
                       </div>
                    </div>
                    <Skeleton className="h-12 w-32 rounded-full mt-4" /> {/* Save Button */}
                 </div>

                 {/* Danger Zone Skeleton */}
                 <div className="bg-red-900/20 p-6 rounded-2xl border border-red-700/50">
                    <Skeleton className="h-7 w-36 mb-4" />
                    <Skeleton className="h-5 w-full mb-4" />
                    <Skeleton className="h-10 w-40 rounded-full" />
                 </div>
            </div>
        </div>
     )
  }

  if (!user) return null;


  return (
    <div className="fixed inset-0 overflow-y-auto bg-black min-h-screen text-white p-6">
      <div className="max-w-3xl mx-auto">
         {/* Back Link */}
         <Link href="/account" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-6 group">
           <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
           Миний булан руу буцах
         </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-white tracking-tight">Тохиргоо</h1>
          <p className="text-neutral-400 text-lg mt-1">Аппликейшны тохиргоог удирдах.</p>
        </div>

        {/* Settings Form */}
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-lg mb-8">
           <h2 className="text-xl font-semibold text-white mb-6 border-b border-neutral-700 pb-4">Үндсэн тохиргоо</h2>

           {/* Notification Setting */}
           <div className="flex items-center justify-between py-4">
             <Label htmlFor="notifications" className="flex flex-col cursor-pointer">
                <span className="font-medium text-white flex items-center"><Bell className="h-5 w-5 mr-2 text-neutral-400"/>Мэдэгдэл хүлээн авах</span>
                <span className="text-sm text-neutral-400 mt-1">Имэйлээр шинэчлэл, мэдээлэл авах эсэх.</span>
             </Label>
             <Switch
               id="notifications"
               checked={settings.receiveNotifications}
               onCheckedChange={(checked) => handleSettingChange('receiveNotifications', checked)}
               // Add custom styling classes if needed via className prop in your Switch component
             />
           </div>

           <div className="h-px bg-neutral-700/50 my-2"></div>

           {/* Theme Setting Example (requires implementation) */}
            <div className="flex items-center justify-between py-4">
              <Label htmlFor="theme" className="flex flex-col">
                 <span className="font-medium text-white flex items-center"><Palette className="h-5 w-5 mr-2 text-neutral-400"/>Дэлгэцийн загвар</span>
                 <span className="text-sm text-neutral-400 mt-1">Аппын харагдах байдлыг сонгох.</span>
              </Label>
               {/* Replace with a Select or Radio Group component */}
              <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value as UserSettings['theme'])}
                  className="bg-neutral-700 border border-neutral-600 rounded-md px-3 py-1.5 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                 <option value="dark">Dark</option>
                 <option value="light" disabled>Light (Тун удахгүй)</option>
                 <option value="system" disabled>System (Тун удахгүй)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-neutral-700">
                 <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving} // Add logic to compare initial and current settings if needed
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-full px-6 py-2 transition-colors font-medium"
                  >
                    {isSaving ? 'Хадгалж байна...' : 'Тохиргоог Хадгалах'}
                  </Button>
            </div>

        </div>


        {/* Danger Zone - Account Deletion */}
        <div className="bg-red-900/20 backdrop-blur-md rounded-2xl p-6 border border-red-700/50 shadow-lg">
             <h2 className="text-xl font-semibold text-red-300 mb-3 flex items-center"><Trash className="h-5 w-5 mr-2"/>Аюултай бүс</h2>
             <p className="text-red-200/80 text-sm mb-4">Данс устгах үйлдлийг буцаах боломжгүйг анхаарна уу. Таны бүх мэдээлэл устах болно.</p>
             <Button
                variant="destructive" // Use a destructive variant if your Button component supports it
                className="bg-red-600 hover:bg-red-700 border border-red-500 text-white rounded-full px-5 py-1.5 text-sm font-medium"
                onClick={() => alert('Данс устгах үйлдэл (Интеграц хийгдээгүй!)')} // Needs proper confirmation modal and backend logic
              >
                Данс Устгах
              </Button>
         </div>

      </div>
    </div>
  )
}

export default SettingsPage