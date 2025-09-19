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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Users, UserPlus, UserMinus } from 'lucide-react'
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

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface TeamPlayer {
  id: string
  userId: string
  playerType: 'player' | 'captain'
  position: string | null
  jerseyNumber: number | null
  isActive: boolean
  user: User
}

interface Team {
  id: string
  seasonId: string
  name: string
  description: string | null
  wins: number
  losses: number
  createdDate: string
  season: Season
  teamPlayers: TeamPlayer[]
}

export function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamFormData, setTeamFormData] = useState({
    seasonId: '',
    name: '',
    description: ''
  })
  const [playerFormData, setPlayerFormData] = useState({
    userId: '',
    playerType: 'player' as 'player' | 'captain',
    position: '',
    jerseyNumber: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teamsResponse, usersResponse, leaguesResponse] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/users'),
        fetch('/api/admin/leagues')
      ])

      const [teamsData, usersData, leaguesData] = await Promise.all([
        teamsResponse.json(),
        usersResponse.json(),
        leaguesResponse.json()
      ])

      setTeams(teamsData.teams)
      setUsers(usersData.users)

      // Extract unique seasons from leagues
      const allSeasons = leaguesData.leagues.flatMap((league: any) =>
        league.seasons?.map((season: any) => ({
          ...season,
          league: { id: league.id, name: league.name }
        })) || []
      )
      setSeasons(allSeasons)

    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamFormData)
      })

      if (response.ok) {
        toast.success('Team created successfully')
        setIsCreateTeamDialogOpen(false)
        resetTeamForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create team')
      }
    } catch (error) {
      toast.error('Failed to create team')
    }
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeam) return

    try {
      const response = await fetch(`/api/admin/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamFormData)
      })

      if (response.ok) {
        toast.success('Team updated successfully')
        setIsEditTeamDialogOpen(false)
        setEditingTeam(null)
        resetTeamForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update team')
      }
    } catch (error) {
      toast.error('Failed to update team')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This will remove all players and game history.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Team deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete team')
      }
    } catch (error) {
      toast.error('Failed to delete team')
    }
  }

  const handleAddPlayerToTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return

    try {
      const response = await fetch('/api/admin/team-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          ...playerFormData,
          jerseyNumber: playerFormData.jerseyNumber ? parseInt(playerFormData.jerseyNumber) : null
        })
      })

      if (response.ok) {
        toast.success('Player added successfully')
        setIsAddPlayerDialogOpen(false)
        resetPlayerForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add player')
      }
    } catch (error) {
      toast.error('Failed to add player')
    }
  }

  const handleRemovePlayer = async (teamPlayerId: string) => {
    if (!confirm('Remove this player from the team?')) return

    try {
      const response = await fetch(`/api/admin/team-players/${teamPlayerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Player removed successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove player')
      }
    } catch (error) {
      toast.error('Failed to remove player')
    }
  }

  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team)
    setTeamFormData({
      seasonId: team.seasonId,
      name: team.name,
      description: team.description || ''
    })
    setIsEditTeamDialogOpen(true)
  }

  const openAddPlayerDialog = (team: Team) => {
    setSelectedTeam(team)
    setIsAddPlayerDialogOpen(true)
  }

  const resetTeamForm = () => {
    setTeamFormData({ seasonId: '', name: '', description: '' })
    setEditingTeam(null)
  }

  const resetPlayerForm = () => {
    setPlayerFormData({ userId: '', playerType: 'player', position: '', jerseyNumber: '' })
    setSelectedTeam(null)
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
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage teams and their players
          </p>
        </div>
        <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={seasons.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new team for a season
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="seasonId">Season *</Label>
                <Select value={teamFormData.seasonId} onValueChange={(value) => setTeamFormData({...teamFormData, seasonId: value})}>
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
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="teamDescription">Description</Label>
                <Textarea
                  id="teamDescription"
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})}
                  placeholder="Team description (optional)"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Team</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateTeamDialogOpen(false)
                    resetTeamForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No teams created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start organizing players
            </p>
            {seasons.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to create seasons first before adding teams
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="teams" className="w-full">
          <TabsList>
            <TabsTrigger value="teams">Teams Overview</TabsTrigger>
            <TabsTrigger value="players">Player Management</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>All Teams ({teams.length})</CardTitle>
                <CardDescription>
                  Manage teams across all seasons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            {team.description && (
                              <div className="text-sm text-muted-foreground">
                                {team.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{team.season.league.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {team.season.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {team.teamPlayers?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {team.wins}W - {team.losses}L
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(team.createdDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddPlayerDialog(team)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditTeamDialog(team)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTeam(team.id)}
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
          </TabsContent>

          <TabsContent value="players">
            <div className="grid gap-6">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        {team.name}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({team.season.league.name} - {team.season.name})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openAddPlayerDialog(team)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Player
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {team.teamPlayers?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No players added yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Jersey #</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.teamPlayers?.map((player) => (
                            <TableRow key={player.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {player.user.firstName} {player.user.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {player.user.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={player.playerType === 'captain' ? 'default' : 'secondary'}>
                                  {player.playerType === 'captain' ? 'Captain' : 'Player'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {player.position ? (
                                  <span className="capitalize">
                                    {player.position.replace('_', ' ')}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {player.jerseyNumber || (
                                  <span className="text-muted-foreground">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemovePlayer(player.id)}
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTeam} className="space-y-4">
            <div>
              <Label htmlFor="editSeasonId">Season *</Label>
              <Select value={teamFormData.seasonId} onValueChange={(value) => setTeamFormData({...teamFormData, seasonId: value})}>
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
              <Label htmlFor="editTeamName">Team Name *</Label>
              <Input
                id="editTeamName"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                placeholder="Enter team name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editTeamDescription">Description</Label>
              <Textarea
                id="editTeamDescription"
                value={teamFormData.description}
                onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})}
                placeholder="Team description (optional)"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditTeamDialogOpen(false)
                  resetTeamForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={isAddPlayerDialogOpen} onOpenChange={setIsAddPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player to Team</DialogTitle>
            <DialogDescription>
              Add a player to {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPlayerToTeam} className="space-y-4">
            <div>
              <Label htmlFor="userId">Player *</Label>
              <Select value={playerFormData.userId} onValueChange={(value) => setPlayerFormData({...playerFormData, userId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => !selectedTeam?.teamPlayers?.some(tp => tp.userId === user.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="playerType">Role</Label>
              <Select value={playerFormData.playerType} onValueChange={(value) => setPlayerFormData({...playerFormData, playerType: value as 'player' | 'captain'})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="captain">Captain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Select value={playerFormData.position} onValueChange={(value) => setPlayerFormData({...playerFormData, position: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside_hitter">Outside Hitter</SelectItem>
                  <SelectItem value="middle_blocker">Middle Blocker</SelectItem>
                  <SelectItem value="setter">Setter</SelectItem>
                  <SelectItem value="opposite">Opposite</SelectItem>
                  <SelectItem value="libero">Libero</SelectItem>
                  <SelectItem value="defensive_specialist">Defensive Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                type="number"
                min="1"
                max="99"
                value={playerFormData.jerseyNumber}
                onChange={(e) => setPlayerFormData({...playerFormData, jerseyNumber: e.target.value})}
                placeholder="Jersey number (optional)"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Add Player</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddPlayerDialogOpen(false)
                  resetPlayerForm()
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