'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Trophy, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface League {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdDate: string
  seasons?: Season[]
}

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  teams?: any[]
  games?: any[]
}

export function LeaguesManagement() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLeague, setEditingLeague] = useState<League | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    fetchLeagues()
  }, [])

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/admin/leagues')
      const data = await response.json()
      setLeagues(data.leagues)
    } catch (error) {
      toast.error('Failed to fetch leagues')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('League created successfully')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', isActive: true })
        fetchLeagues()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create league')
      }
    } catch (error) {
      toast.error('Failed to create league')
    }
  }

  const handleEditLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLeague) return

    try {
      const response = await fetch(`/api/admin/leagues/${editingLeague.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('League updated successfully')
        setIsEditDialogOpen(false)
        setEditingLeague(null)
        setFormData({ name: '', description: '', isActive: true })
        fetchLeagues()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update league')
      }
    } catch (error) {
      toast.error('Failed to update league')
    }
  }

  const handleDeleteLeague = async (leagueId: string) => {
    if (!confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('League deleted successfully')
        fetchLeagues()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete league')
      }
    } catch (error) {
      toast.error('Failed to delete league')
    }
  }

  const openEditDialog = (league: League) => {
    setEditingLeague(league)
    setFormData({
      name: league.name,
      description: league.description || '',
      isActive: league.isActive
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true })
    setEditingLeague(null)
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
          <h2 className="text-xl font-semibold">League Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage volleyball leagues
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create League
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New League</DialogTitle>
              <DialogDescription>
                Create a new volleyball league with basic information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <Label htmlFor="name">League Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter league name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter league description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active League</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create League</Button>
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

      {leagues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No leagues created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first volleyball league to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Leagues ({leagues.length})</CardTitle>
            <CardDescription>
              Manage existing leagues and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>League Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Seasons</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{league.name}</div>
                        {league.description && (
                          <div className="text-sm text-muted-foreground">
                            {league.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={league.isActive ? 'default' : 'secondary'}>
                        {league.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {league.seasons?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(league.createdDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(league)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLeague(league.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit League Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit League</DialogTitle>
            <DialogDescription>
              Update league information and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLeague} className="space-y-4">
            <div>
              <Label htmlFor="editName">League Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter league name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter league description (optional)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="editIsActive">Active League</Label>
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