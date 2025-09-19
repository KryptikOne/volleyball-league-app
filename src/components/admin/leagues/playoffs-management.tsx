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
import { Plus, Edit, Trash2, Award, Trophy, Users, Play } from 'lucide-react'
import { toast } from 'sonner'

interface League {
  id: string
  name: string
}

interface Season {
  id: string
  name: string
  league: League
}

interface Team {
  id: string
  name: string
  wins: number
  losses: number
}

interface PlayoffBracket {
  id: string
  seasonId: string
  name: string
  description: string | null
  bracketType: 'single_elimination' | 'double_elimination' | 'round_robin'
  status: 'setup' | 'in_progress' | 'completed'
  startDate: string | null
  endDate: string | null
  createdDate: string
  season: Season
  playoffTeams?: PlayoffTeam[]
  playoffGames?: PlayoffGame[]
}

interface PlayoffTeam {
  id: string
  playoffBracketId: string
  teamId: string
  seed: number
  isActive: boolean
  team: Team
}

interface PlayoffGame {
  id: string
  playoffBracketId: string
  round: number
  position: number
  homeTeamId: string | null
  awayTeamId: string | null
  winnerId: string | null
  gameDate: string | null
  gameTime: string | null
  courtLocation: string | null
  status: 'scheduled' | 'in_progress' | 'completed'
  homeTeamScore: number | null
  awayTeamScore: number | null
  homeTeam?: Team
  awayTeam?: Team
  winner?: Team
}

export function PlayoffsManagement() {
  const [brackets, setBrackets] = useState<PlayoffBracket[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [selectedBracket, setSelectedBracket] = useState<PlayoffBracket | null>(null)
  const [isCreateBracketDialogOpen, setIsCreateBracketDialogOpen] = useState(false)
  const [isEditBracketDialogOpen, setIsEditBracketDialogOpen] = useState(false)
  const [isTeamSelectionDialogOpen, setIsTeamSelectionDialogOpen] = useState(false)
  const [editingBracket, setEditingBracket] = useState<PlayoffBracket | null>(null)
  const [bracketFormData, setBracketFormData] = useState({
    seasonId: '',
    name: '',
    description: '',
    bracketType: 'single_elimination' as PlayoffBracket['bracketType'],
    startDate: '',
    endDate: ''
  })
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      fetchTeamsForSeason(selectedSeason)
    }
  }, [selectedSeason])

  const fetchData = async () => {
    try {
      const [bracketsResponse, seasonsResponse] = await Promise.all([
        fetch('/api/admin/playoff-brackets'),
        fetch('/api/admin/seasons')
      ])

      const [bracketsData, seasonsData] = await Promise.all([
        bracketsResponse.json(),
        seasonsResponse.json()
      ])

      setBrackets(bracketsData.brackets)
      setSeasons(seasonsData.seasons)

    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamsForSeason = async (seasonId: string) => {
    try {
      const response = await fetch(`/api/admin/seasons/${seasonId}/teams`)
      const data = await response.json()
      setTeams(data.teams.sort((a: Team, b: Team) => {
        const aWinPercentage = a.wins / (a.wins + a.losses) || 0
        const bWinPercentage = b.wins / (b.wins + b.losses) || 0
        return bWinPercentage - aWinPercentage // Sort by win percentage descending
      }))
    } catch (error) {
      toast.error('Failed to fetch teams')
    }
  }

  const handleCreateBracket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/playoff-brackets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bracketFormData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Playoff bracket created successfully')
        setIsCreateBracketDialogOpen(false)
        resetBracketForm()
        fetchData()
        // Open team selection dialog
        setSelectedBracket(data.bracket)
        setSelectedSeason(data.bracket.seasonId)
        fetchTeamsForSeason(data.bracket.seasonId)
        setIsTeamSelectionDialogOpen(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create bracket')
      }
    } catch (error) {
      toast.error('Failed to create bracket')
    }
  }

  const handleEditBracket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBracket) return

    try {
      const response = await fetch(`/api/admin/playoff-brackets/${editingBracket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bracketFormData)
      })

      if (response.ok) {
        toast.success('Playoff bracket updated successfully')
        setIsEditBracketDialogOpen(false)
        setEditingBracket(null)
        resetBracketForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update bracket')
      }
    } catch (error) {
      toast.error('Failed to update bracket')
    }
  }

  const handleDeleteBracket = async (bracketId: string) => {
    if (!confirm('Are you sure you want to delete this playoff bracket? This will remove all associated games and results.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/playoff-brackets/${bracketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Playoff bracket deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete bracket')
      }
    } catch (error) {
      toast.error('Failed to delete bracket')
    }
  }

  const handleSaveTeamSelection = async () => {
    if (!selectedBracket || selectedTeams.length < 2) {
      toast.error('Please select at least 2 teams')
      return
    }

    try {
      const response = await fetch(`/api/admin/playoff-brackets/${selectedBracket.id}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamIds: selectedTeams })
      })

      if (response.ok) {
        toast.success('Teams added to bracket successfully')
        setIsTeamSelectionDialogOpen(false)
        setSelectedTeams([])
        setSelectedBracket(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add teams')
      }
    } catch (error) {
      toast.error('Failed to add teams')
    }
  }

  const handleGenerateBracket = async (bracketId: string) => {
    try {
      const response = await fetch(`/api/admin/playoff-brackets/${bracketId}/generate`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Generated ${data.gamesCreated} playoff games`)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate bracket')
      }
    } catch (error) {
      toast.error('Failed to generate bracket')
    }
  }

  const openEditBracketDialog = (bracket: PlayoffBracket) => {
    setEditingBracket(bracket)
    setBracketFormData({
      seasonId: bracket.seasonId,
      name: bracket.name,
      description: bracket.description || '',
      bracketType: bracket.bracketType,
      startDate: bracket.startDate ? bracket.startDate.split('T')[0] : '',
      endDate: bracket.endDate ? bracket.endDate.split('T')[0] : ''
    })
    setIsEditBracketDialogOpen(true)
  }

  const openTeamSelectionDialog = (bracket: PlayoffBracket) => {
    setSelectedBracket(bracket)
    setSelectedSeason(bracket.seasonId)
    fetchTeamsForSeason(bracket.seasonId)
    // Pre-select already added teams
    const currentTeamIds = bracket.playoffTeams?.map(pt => pt.teamId) || []
    setSelectedTeams(currentTeamIds)
    setIsTeamSelectionDialogOpen(true)
  }

  const resetBracketForm = () => {
    setBracketFormData({
      seasonId: '',
      name: '',
      description: '',
      bracketType: 'single_elimination',
      startDate: '',
      endDate: ''
    })
    setEditingBracket(null)
    setSelectedSeason('')
  }

  const getStatusColor = (status: PlayoffBracket['status']) => {
    switch (status) {
      case 'setup':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBracketTypeLabel = (type: PlayoffBracket['bracketType']) => {
    switch (type) {
      case 'single_elimination':
        return 'Single Elimination'
      case 'double_elimination':
        return 'Double Elimination'
      case 'round_robin':
        return 'Round Robin'
      default:
        return type
    }
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
          <h2 className="text-xl font-semibold">Playoffs Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage playoff brackets and tournaments
          </p>
        </div>
        <Dialog open={isCreateBracketDialogOpen} onOpenChange={setIsCreateBracketDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={seasons.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playoff Bracket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Playoff Bracket</DialogTitle>
              <DialogDescription>
                Create a new playoff bracket for a season
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBracket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seasonId">Season *</Label>
                  <Select
                    value={bracketFormData.seasonId}
                    onValueChange={(value) => setBracketFormData({...bracketFormData, seasonId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.league.name} - {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bracketType">Bracket Type *</Label>
                  <Select
                    value={bracketFormData.bracketType}
                    onValueChange={(value) => setBracketFormData({...bracketFormData, bracketType: value as PlayoffBracket['bracketType']})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bracket type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_elimination">Single Elimination</SelectItem>
                      <SelectItem value="double_elimination">Double Elimination</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Bracket Name *</Label>
                <Input
                  id="name"
                  value={bracketFormData.name}
                  onChange={(e) => setBracketFormData({...bracketFormData, name: e.target.value})}
                  placeholder="e.g., Spring 2024 Playoffs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={bracketFormData.description}
                  onChange={(e) => setBracketFormData({...bracketFormData, description: e.target.value})}
                  placeholder="Playoff bracket description (optional)"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={bracketFormData.startDate}
                    onChange={(e) => setBracketFormData({...bracketFormData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={bracketFormData.endDate}
                    onChange={(e) => setBracketFormData({...bracketFormData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Bracket</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateBracketDialogOpen(false)
                    resetBracketForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {brackets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No playoff brackets created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first playoff bracket to organize tournaments
            </p>
            {seasons.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create seasons first before adding playoffs
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Playoff Brackets ({brackets.length})</CardTitle>
            <CardDescription>
              Manage playoff brackets and tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bracket Name</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brackets.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bracket.name}</div>
                        {bracket.description && (
                          <div className="text-sm text-muted-foreground">
                            {bracket.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bracket.season.league.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bracket.season.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBracketTypeLabel(bracket.bracketType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bracket.status)}>
                        {bracket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {bracket.playoffTeams?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bracket.startDate ? (
                        <div className="text-sm">
                          <div>{new Date(bracket.startDate).toLocaleDateString()}</div>
                          {bracket.endDate && (
                            <div className="text-muted-foreground">
                              to {new Date(bracket.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTeamSelectionDialog(bracket)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {bracket.playoffTeams && bracket.playoffTeams.length >= 2 && bracket.status === 'setup' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleGenerateBracket(bracket.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditBracketDialog(bracket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBracket(bracket.id)}
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

      {/* Edit Bracket Dialog */}
      <Dialog open={isEditBracketDialogOpen} onOpenChange={setIsEditBracketDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Playoff Bracket</DialogTitle>
            <DialogDescription>
              Update playoff bracket information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBracket} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSeasonId">Season *</Label>
                <Select
                  value={bracketFormData.seasonId}
                  onValueChange={(value) => setBracketFormData({...bracketFormData, seasonId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.league.name} - {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editBracketType">Bracket Type *</Label>
                <Select
                  value={bracketFormData.bracketType}
                  onValueChange={(value) => setBracketFormData({...bracketFormData, bracketType: value as PlayoffBracket['bracketType']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bracket type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Single Elimination</SelectItem>
                    <SelectItem value="double_elimination">Double Elimination</SelectItem>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="editName">Bracket Name *</Label>
              <Input
                id="editName"
                value={bracketFormData.name}
                onChange={(e) => setBracketFormData({...bracketFormData, name: e.target.value})}
                placeholder="e.g., Spring 2024 Playoffs"
                required
              />
            </div>

            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={bracketFormData.description}
                onChange={(e) => setBracketFormData({...bracketFormData, description: e.target.value})}
                placeholder="Playoff bracket description (optional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={bracketFormData.startDate}
                  onChange={(e) => setBracketFormData({...bracketFormData, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={bracketFormData.endDate}
                  onChange={(e) => setBracketFormData({...bracketFormData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditBracketDialogOpen(false)
                  resetBracketForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Selection Dialog */}
      <Dialog open={isTeamSelectionDialogOpen} onOpenChange={setIsTeamSelectionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Teams for Playoff</DialogTitle>
            <DialogDescription>
              Choose teams to participate in {selectedBracket?.name}. Teams are ordered by win percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No teams found for this season
                </p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team, index) => {
                    const winPercentage = team.wins + team.losses > 0
                      ? ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
                      : '0.0'

                    return (
                      <div
                        key={team.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTeams.includes(team.id)
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (selectedTeams.includes(team.id)) {
                            setSelectedTeams(selectedTeams.filter(id => id !== team.id))
                          } else {
                            setSelectedTeams([...selectedTeams, team.id])
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => {}} // Handled by div onClick
                          className="h-4 w-4"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">#{index + 1} {team.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {team.wins}W-{team.losses}L ({winPercentage}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedTeams.length} teams selected
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTeamSelection} disabled={selectedTeams.length < 2}>
                  Save Selection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTeamSelectionDialogOpen(false)
                    setSelectedTeams([])
                    setSelectedBracket(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}