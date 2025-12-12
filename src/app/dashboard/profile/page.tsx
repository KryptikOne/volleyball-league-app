import { requireAuth } from '@/lib/auth-utils'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Ruler, Shield, MarsStroke } from 'lucide-react'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'

async function getUserProfile(userId: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      gender: true,
      heightInches: true,
      skillLevel: true,
      isAdministrator: true,
      createdDate: true,
    },
  })
}

export default async function ProfilePage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile) {
    return <div>Profile not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profile.firstName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profile.lastName} readOnly />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} readOnly />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone || 'Not provided'} readOnly />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={profile.address || 'Not provided'} readOnly />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={profile.city || 'Not provided'} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={profile.state || 'Not provided'} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="zip">Zip</Label>
                    <Input id="zip" value={profile.zipCode || 'Not provided'} readOnly />
                  </div>
                </div>

                <div className="pt-4">
                  <Button>Edit Profile</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="text-sm">Account Type</span>
                    </div>
                    <Badge variant={profile.isAdministrator ? 'default' : 'secondary'}>
                      {profile.isAdministrator ? 'Administrator' : 'Player'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">Member Since</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {profile.createdDate ? new Date(profile.createdDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Player Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.skillLevel && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Skill Level</span>
                      <Badge variant="outline" className="capitalize">
                        {profile.skillLevel}
                      </Badge>
                    </div>
                  )}

                  {profile.heightInches && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 mr-2" />
                        <span className="text-sm">Height</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(profile.heightInches / 12)}&apos;{profile.heightInches % 12}&quot;
                      </span>
                    </div>
                  )}

                  {profile.gender && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MarsStroke className="h-4 w-4 mr-2" />
                        <span className="text-sm">Gender</span>
                      </div>
                      <span className="text-sm text-muted-foreground capitalize">
                        {profile.gender.replace('-', ' ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}