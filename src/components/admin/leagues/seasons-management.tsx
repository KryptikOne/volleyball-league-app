// src/components/admin/leagues/seasons-management.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Calendar, Users, Gamepad } from 'lucide-react'
import { toast } from 'sonner'

interface League {
  id: string
  name: string
  isActive: boolean
}

interface Season {
  id: string
  leagueId: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  registrationStartDate: string | null
  registrationEndDate: string | null
  maxTeams: number | null
  createdDate: string
  league: League
  teams?: any[]
  games?: any[]
}

export function SeasonsManagement() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [formData, setFormData] = useState({
    leagueId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    maxTeams: ''
  })

  useEffect(() => {
    fetchLeaguesAndSeasons()
  }, [])

  const fetchLeaguesAndSeasons = async () => {
    try {
      const [leaguesResponse] = await Promise.all([
        fetch('/api/admin/leagues')
      ])

      const leaguesData = await leaguesResponse.json()
      setLeagues(leaguesData.leagues)

      // Get all seasons from all leagues
      const allSeasons = leaguesData.leagues.flatMap((league: any) =>
        league.seasons?.map((season: any) => ({
          ...season,
          league: { id: league.id, name: league.name, isActive: league.isActive }
        })) || []
      )
      setSeasons(allSeasons)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null
        })
      })

      if (response.ok) {
        toast.success('Season created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchLeaguesAndSeasons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create season')
      }
    } catch (error) {
      toast.error('Failed to create season')
    }
  }

  const handleEditSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSeason) return

    try {
      const response = await fetch(`/api/admin/seasons/${editingSeason.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null
        })
      })

      if (response.ok) {
        toast.success('Season updated successfully')
        setIsEditDialogOpen(false)
        setEditingSeason(null)
        resetForm()
        fetchLeaguesAndSeasons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update season')
      }
    } catch (error) {
      toast.error('Failed to update season')
    }
  }

  const handleDeleteSeason = async (seasonId: string) => {
    if (!confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Season deleted successfully')
        fetchLeaguesAndSeasons()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete season')
      }
    } catch (error) {
      toast.error('Failed to delete season')
    }
  }

  const openEditDialog = (season: Season) => {
    setEditingSeason(season)
    setFormData({
      leagueId: season.leagueId,
      name: season.name,
      description: season.description || '',
      startDate: season.startDate.split('T')[0],
      endDate: season.endDate.split('T')[0],
      registrationStartDate: season.registrationStartDate ? season.registrationStartDate.split('T')[0] : '',
      registrationEndDate: season.registrationEndDate ? season.registrationEndDate.split('T')[0] : '',
      maxTeams: season.maxTeams ? season.maxTeams.toString() : ''
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      leagueId: '',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      registrationStartDate: '',
      registrationEndDate: '',
      maxTeams: ''
    })
    setEditingSeason(null)
  }

  const getSeasonStatus = (season: Season) => {
    const now = new Date()
    const startDate = new Date(season.startDate)
    const endDate = new Date(season.endDate)

    if (now < startDate) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' }
    if (now > endDate) return { status: 'completed', color: 'bg-gray-100 text-gray-800' }
    return { status: 'active', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Season Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage seasons within leagues
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={leagues.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Season
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Season</DialogTitle>
              <DialogDescription>
                Create a new season within an existing league
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leagueId">League *</Label>
                  <Select value={formData.leagueId} onValueChange={(value) => setFormData({...formData, leagueId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.filter(league => league.isActive).map((league) => (
                        <SelectItem key={league.id} value={league.id}>
                          {league.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Season Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Spring 2024"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Season description (optional)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationStartDate">Registration Start</Label>
                  <Input
                    id="registrationStartDate"
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => setFormData({...formData, registrationStartDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="registrationEndDate">Registration End</Label>
                  <Input
                    id="registrationEndDate"
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => setFormData({...formData, registrationEndDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxTeams">Maximum Teams</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="1"
                  value={formData.maxTeams}
                  onChange={(e) => setFormData({...formData, maxTeams: e.target.value})}
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Season</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No seasons created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first season to start organizing games
            </p>
            {leagues.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create a league first before adding seasons
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Seasons ({seasons.length})</CardTitle>
            <CardDescription>
              Manage seasons across all leagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season Name</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Max Teams</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => {
                  const { status, color } = getSeasonStatus(season)
                  return (
                    <TableRow key={season.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{season.name}</div>
                          {season.description && (
                            <div className="text-sm text-muted-foreground">
                              {season.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span>{season.league.name}</span>
                          {!season.league.isActive && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={color}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(season.startDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(season.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {season.teams?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {season.maxTeams || 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(season)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSeason(season.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Season Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Season</DialogTitle>
            <DialogDescription>
              Update season information and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSeason} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editLeagueId">League *</Label>
                <Select value={formData.leagueId} onValueChange={(value) => setFormData({...formData, leagueId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name} {!league.isActive && '(Inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editName">Season Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Spring 2024"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Season description (optional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStartDate">Start Date *</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEndDate">End Date *</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRegistrationStartDate">Registration Start</Label>
                <Input
                  id="editRegistrationStartDate"
                  type="date"
                  value={formData.registrationStartDate}
                  onChange={(e) => setFormData({...formData, registrationStartDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editRegistrationEndDate">Registration End</Label>
                <Input
                  id="editRegistrationEndDate"
                  type="date"
                  value={formData.registrationEndDate}
                  onChange={(e) => setFormData({...formData, registrationEndDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editMaxTeams">Maximum Teams</Label>
              <Input
                id="editMaxTeams"
                type="number"
                min="1"
                value={formData.maxTeams}
                onChange={(e) => setFormData({...formData, maxTeams: e.target.value})}
                placeholder="Leave empty for no limit"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}