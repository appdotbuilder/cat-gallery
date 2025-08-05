
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { CatWithPhotos, CreateCatInput, CreatePhotoInput, CreateUserInput, User } from '../../server/src/schema';

function App() {
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Cats and photos state
  const [cats, setCats] = useState<CatWithPhotos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms state
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [photoFormOpen, setPhotoFormOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  
  const [userFormData, setUserFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    display_name: null,
    avatar_url: null
  });

  const [catFormData, setCatFormData] = useState<CreateCatInput>({
    name: '',
    breed: null,
    age: null,
    description: null,
    user_id: 0
  });

  const [photoFormData, setPhotoFormData] = useState<CreatePhotoInput>({
    cat_id: 0,
    url: '',
    filename: '',
    file_size: 0,
    mime_type: 'image/jpeg',
    caption: null,
    is_primary: false
  });

  // Load cats for current user
  const loadUserCats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getCatsByUser.query({ user_id: currentUser.id });
      setCats(result);
    } catch (error) {
      console.error('Failed to load cats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserCats();
  }, [loadUserCats]);

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(userFormData);
      setCurrentUser(newUser);
      setUserFormData({
        username: '',
        email: '',
        display_name: null,
        avatar_url: null
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create cat
  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const catData = { ...catFormData, user_id: currentUser.id };
      const newCat = await trpc.createCat.mutate(catData);
      // Transform Cat to CatWithPhotos for state consistency
      const catWithPhotos: CatWithPhotos = { ...newCat, photos: [] };
      setCats((prev: CatWithPhotos[]) => [...prev, catWithPhotos]);
      setCatFormOpen(false);
      setCatFormData({
        name: '',
        breed: null,
        age: null,
        description: null,
        user_id: 0
      });
    } catch (error) {
      console.error('Failed to create cat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create photo
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;
    
    setIsLoading(true);
    try {
      const photoData = { 
        ...photoFormData, 
        cat_id: selectedCatId,
        file_size: Math.floor(Math.random() * 1000000) + 100000, // Stub file size
        filename: photoFormData.url.split('/').pop() || 'photo.jpg'
      };
      const newPhoto = await trpc.createPhoto.mutate(photoData);
      
      // Update cats state to include new photo
      setCats((prev: CatWithPhotos[]) => prev.map((cat: CatWithPhotos) => 
        cat.id === selectedCatId 
          ? { ...cat, photos: [...cat.photos, newPhoto] }
          : cat
      ));
      
      setPhotoFormOpen(false);
      setPhotoFormData({
        cat_id: 0,
        url: '',
        filename: '',
        file_size: 0,
        mime_type: 'image/jpeg',
        caption: null,
        is_primary: false
      });
      setSelectedCatId(null);
    } catch (error) {
      console.error('Failed to create photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If no user, show user creation form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🐱 Welcome to CatShare! 🐱
            </CardTitle>
            <p className="text-gray-600">Create your account to start sharing adorable cat photos</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                placeholder="Username"
                value={userFormData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                }
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={userFormData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <Input
                placeholder="Display Name (optional)"
                value={userFormData.display_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev: CreateUserInput) => ({
                    ...prev,
                    display_name: e.target.value || null
                  }))
                }
              />
              <Input
                placeholder="Avatar URL (optional)"
                value={userFormData.avatar_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserFormData((prev: CreateUserInput) => ({
                    ...prev,
                    avatar_url: e.target.value || null
                  }))
                }
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-pink-500 hover:bg-pink-600">
                {isLoading ? 'Creating Account...' : '🚀 Join CatShare'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="bg-pink-100 text-pink-700">
                  {currentUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-800">🐱 CatShare</h1>
                <p className="text-sm text-gray-600">Hello, {currentUser.display_name || currentUser.username}!</p>
              </div>
            </div>
            <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                  ➕ Add Cat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>🐱 Add Your Cat</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCat} className="space-y-4">
                  <Input
                    placeholder="Cat's name"
                    value={catFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Breed (optional)"
                    value={catFormData.breed || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({
                        ...prev,
                        breed: e.target.value || null
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Age (optional)"
                    value={catFormData.age || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({
                        ...prev,
                        age: e.target.value ? parseInt(e.target.value) : null
                      }))
                    }
                    min="0"
                    max="30"
                  />
                  <Textarea
                    placeholder="Tell us about your cat... (optional)"
                    value={catFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCatFormData((prev: CreateCatInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    maxLength={500}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full bg-pink-500 hover:bg-pink-600">
                    {isLoading ? 'Adding Cat...' : '💕 Add Cat'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {cats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐱</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No cats yet!</h2>
            <p className="text-gray-600 mb-6">Add your first furry friend to get started sharing photos</p>
            <Button 
              onClick={() => setCatFormOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              ➕ Add Your First Cat
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {cats.map((cat: CatWithPhotos) => (
              <Card key={cat.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        🐱 {cat.name}
                        {cat.breed && <Badge variant="secondary">{cat.breed}</Badge>}
                        {cat.age && <Badge variant="outline">{cat.age} years old</Badge>}
                      </CardTitle>
                      {cat.description && (
                        <p className="text-gray-600 text-sm mt-1">{cat.description}</p>
                      )}
                    </div>
                    <Dialog 
                      open={photoFormOpen && selectedCatId === cat.id} 
                      onOpenChange={(open) => {
                        setPhotoFormOpen(open);
                        if (open) setSelectedCatId(cat.id);
                        else setSelectedCatId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setSelectedCatId(cat.id)}
                        >
                          📸 Add Photo
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md mx-4">
                        <DialogHeader>
                          <DialogTitle>📸 Add Photo for {cat.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreatePhoto} className="space-y-4">
                          <Input
                            placeholder="Photo URL"
                            value={photoFormData.url}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPhotoFormData((prev: CreatePhotoInput) => ({ ...prev, url: e.target.value }))
                            }
                            required
                          />
                          <Input
                            placeholder="Caption (optional)"
                            value={photoFormData.caption || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPhotoFormData((prev: CreatePhotoInput) => ({
                                ...prev,
                                caption: e.target.value || null
                              }))
                            }
                            maxLength={200}
                          />
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_primary"
                              checked={photoFormData.is_primary}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setPhotoFormData((prev: CreatePhotoInput) => ({
                                  ...prev,
                                  is_primary: e.target.checked
                                }))
                              }
                            />
                            <label htmlFor="is_primary" className="text-sm text-gray-700">
                              Set as primary photo ⭐
                            </label>
                          </div>
                          <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600">
                            {isLoading ? 'Adding Photo...' : '📸 Add Photo'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {cat.photos.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-gray-600">No photos yet</p>
                      <p className="text-sm text-gray-500">Add the first photo of {cat.name}!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {cat.photos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Photo of ${cat.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=🐱';
                              }}
                            />
                            {photo.is_primary && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500 text-white text-xs">⭐ Primary</Badge>
                              </div>
                            )}
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
