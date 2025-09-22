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
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Trophy } from 'lucide-react'
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
  season: Season
}

interface Game {
  id: string
  seasonId: string
  homeTeamId: string
  awayTeamId: string
  gameDate: string
  gameTime: string | null
  courtLocation: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  homeTeamScore: number | null
  awayTeamScore: number | null
  notes: string | null
  createdDate: string
  homeTeam: Team
  awayTeam: Team
}

export function GamesManagement() {
  const [games, setGames] = useState<Game[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [isCreateGameDialogOpen, setIsCreateGameDialogOpen] = useState(false)
  const [isEditGameDialogOpen, setIsEditGameDialogOpen] = useState(false)
  const [isBulkScheduleDialogOpen, setIsBulkScheduleDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [gameFormData, setGameFormData] = useState({
    seasonId: '',
    homeTeamId: '',
    awayTeamId: '',
    gameDate: '',
    gameTime: '',
    courtLocation: '',
    status: 'scheduled' as Game['status'],
    homeTeamScore: '',
    awayTeamScore: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
    fetchSeasons()
  }, [])

  useEffect(() => {
    if (gameFormData.seasonId) {
      fetchTeamsForSeason(gameFormData.seasonId)
    }
  }, [gameFormData.seasonId])

  const fetchSeasons = async () => {
    try {
      const [seasonsResponse] = await Promise.all([
        fetch('/api/admin/seasons')
      ])

      const seasonsData = await seasonsResponse.json()
      setSeasons(seasonsData.seasons || [])

    } catch (error) {
      console.error('Error fetching seasons:', error)
    }
  }

  const fetchData = async () => {
    try {
      const [gamesResponse] = await Promise.all([
        fetch('/api/admin/games')
      ])

  const gamesData = await gamesResponse.json()
  setGames(gamesData.games || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamsForSeason = async (seasonId: string) => {
    try {
      const response = await fetch(`/api/admin/seasons/${seasonId}/teams`)
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      toast.error('Failed to fetch teams')
    }
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gameFormData,
          homeTeamScore: gameFormData.homeTeamScore ? parseInt(gameFormData.homeTeamScore) : null,
          awayTeamScore: gameFormData.awayTeamScore ? parseInt(gameFormData.awayTeamScore) : null
        })
      })

      if (response.ok) {
        toast.success('Game created successfully')
        setIsCreateGameDialogOpen(false)
        resetGameForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create game')
      }
    } catch (error) {
      console.error('Error creating game:', error)
      toast.error('Failed to create game')
    }
  }

  const handleEditGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGame) return

    try {
      const response = await fetch(`/api/admin/games/${editingGame.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...gameFormData,
          homeTeamScore: gameFormData.homeTeamScore ? parseInt(gameFormData.homeTeamScore) : null,
          awayTeamScore: gameFormData.awayTeamScore ? parseInt(gameFormData.awayTeamScore) : null
        })
      })

      if (response.ok) {
        toast.success('Game updated successfully')
        setIsEditGameDialogOpen(false)
        setEditingGame(null)
        resetGameForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update game')
      }
    } catch (error) {
      console.error('Error updating game:', error)
      toast.error('Failed to update game')
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Game deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete game')
      }
    } catch (error) {
      console.error('Error deleting game:', error)
      toast.error('Failed to delete game')
    }
  }

  const handleBulkScheduleGeneration = async () => {
    if (!selectedSeason) {
      toast.error('Please select a season first')
      return
    }

    try {
      const response = await fetch('/api/admin/games/bulk-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId: selectedSeason })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Generated ${data.gamesCreated} games successfully`)
        setIsBulkScheduleDialogOpen(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate schedule')
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      toast.error('Failed to generate schedule')
    }
  }

  const openEditGameDialog = (game: Game) => {
    setEditingGame(game)
    setGameFormData({
      seasonId: game.seasonId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      gameDate: game.gameDate.split('T')[0],
      gameTime: game.gameTime || '',
      courtLocation: game.courtLocation || '',
      status: game.status,
      homeTeamScore: game.homeTeamScore ? game.homeTeamScore.toString() : '',
      awayTeamScore: game.awayTeamScore ? game.awayTeamScore.toString() : '',
      notes: game.notes || ''
    })
    // Fetch teams for this season
    fetchTeamsForSeason(game.seasonId)
    setIsEditGameDialogOpen(true)
  }

  const resetGameForm = () => {
    setGameFormData({
      seasonId: '',
      homeTeamId: '',
      awayTeamId: '',
      gameDate: '',
      gameTime: '',
      courtLocation: '',
      status: 'scheduled',
      homeTeamScore: '',
      awayTeamScore: '',
      notes: ''
    })
    setEditingGame(null)
    setTeams([])
  }

  const getStatusColor = (status: Game['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'postponed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredGames = selectedSeason
    ? games.filter(game => game.seasonId === selectedSeason)
    : games

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
          <h2 className="text-xl font-semibold">Game Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage game schedules and results
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkScheduleDialogOpen} onOpenChange={setIsBulkScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Generate Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Season Schedule</DialogTitle>
                <DialogDescription>
                  Automatically generate a round-robin schedule for all teams in a season
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Season</Label>
                  <Select value={selectedSeason || undefined} onValueChange={(value) => setSelectedSeason(value || '')}>
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
                <div className="flex gap-2">
                  <Button onClick={handleBulkScheduleGeneration} disabled={!selectedSeason}>
                    Generate Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setIsBulkScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateGameDialogOpen} onOpenChange={setIsCreateGameDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Game
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Game</DialogTitle>
                <DialogDescription>
                  Schedule a new game between two teams
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seasonId">Season *</Label>
                    <Select
                      value={gameFormData.seasonId || undefined}
                      onValueChange={(value) => setGameFormData({...gameFormData, seasonId: value || '', homeTeamId: '', awayTeamId: ''})}
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={gameFormData.status}
                      onValueChange={(value) => setGameFormData({...gameFormData, status: value as Game['status']})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="postponed">Postponed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeTeamId">Home Team *</Label>
                    <Select
                      value={gameFormData.homeTeamId || undefined}
                      onValueChange={(value) => setGameFormData({...gameFormData, homeTeamId: value || ''})}
                      disabled={!gameFormData.seasonId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={gameFormData.seasonId ? "Select home team" : "Select season first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="awayTeamId">Away Team *</Label>
                    <Select
                      value={gameFormData.awayTeamId || undefined}
                      onValueChange={(value) => setGameFormData({...gameFormData, awayTeamId: value || ''})}
                      disabled={!gameFormData.seasonId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={gameFormData.seasonId ? "Select away team" : "Select season first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(team => team.id !== gameFormData.homeTeamId).map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gameDate">Game Date *</Label>
                    <Input
                      id="gameDate"
                      type="date"
                      value={gameFormData.gameDate}
                      onChange={(e) => setGameFormData({...gameFormData, gameDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gameTime">Game Time</Label>
                    <Input
                      id="gameTime"
                      type="time"
                      value={gameFormData.gameTime}
                      onChange={(e) => setGameFormData({...gameFormData, gameTime: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="courtLocation">Court Location</Label>
                  <Input
                    id="courtLocation"
                    value={gameFormData.courtLocation}
                    onChange={(e) => setGameFormData({...gameFormData, courtLocation: e.target.value})}
                    placeholder="Enter court or venue location"
                  />
                </div>

                {gameFormData.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="homeTeamScore">Home Team Score</Label>
                      <Input
                        id="homeTeamScore"
                        type="number"
                        min="0"
                        value={gameFormData.homeTeamScore}
                        onChange={(e) => setGameFormData({...gameFormData, homeTeamScore: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="awayTeamScore">Away Team Score</Label>
                      <Input
                        id="awayTeamScore"
                        type="number"
                        min="0"
                        value={gameFormData.awayTeamScore}
                        onChange={(e) => setGameFormData({...gameFormData, awayTeamScore: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={gameFormData.notes}
                    onChange={(e) => setGameFormData({...gameFormData, notes: e.target.value})}
                    placeholder="Game notes (optional)"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!gameFormData.seasonId || !gameFormData.homeTeamId || !gameFormData.awayTeamId || !gameFormData.gameDate}>
                    Create Game
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateGameDialogOpen(false)
                      resetGameForm()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Season Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Season</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedSeason || undefined} onValueChange={(value) => setSelectedSeason(value || '')}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="All seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-seasons">All seasons</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.league.name} - {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeason && (
              <Button variant="outline" onClick={() => setSelectedSeason('')}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredGames.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No games found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedSeason ? 'No games scheduled for this season' : 'No games created yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Games ({filteredGames.length})
              {selectedSeason && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  - {seasons.find(s => s.id === selectedSeason)?.league.name} - {seasons.find(s => s.id === selectedSeason)?.name}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Manage game schedules and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teams</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {game.homeTeam.name} vs {game.awayTeam.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {game.homeTeam.season.league.name} - {game.homeTeam.season.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(game.gameDate).toLocaleDateString()}
                        </div>
                        {game.gameTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {game.gameTime}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {game.courtLocation ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {game.courtLocation}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(game.status)}>
                        {game.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {game.status === 'completed' && game.homeTeamScore !== null && game.awayTeamScore !== null ? (
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1" />
                          {game.homeTeamScore} - {game.awayTeamScore}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditGameDialog(game)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGame(game.id)}
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

      {/* Edit Game Dialog */}
      <Dialog open={isEditGameDialogOpen} onOpenChange={setIsEditGameDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update game information and results
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGame} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSeasonId">Season *</Label>
                <Select
                  value={gameFormData.seasonId || undefined}
                  onValueChange={(value) => setGameFormData({...gameFormData, seasonId: value || '', homeTeamId: '', awayTeamId: ''})}
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
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={gameFormData.status}
                  onValueChange={(value) => setGameFormData({...gameFormData, status: value as Game['status']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editHomeTeamId">Home Team *</Label>
                <Select
                  value={gameFormData.homeTeamId || undefined}
                  onValueChange={(value) => setGameFormData({...gameFormData, homeTeamId: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editAwayTeamId">Away Team *</Label>
                <Select
                  value={gameFormData.awayTeamId || undefined}
                  onValueChange={(value) => setGameFormData({...gameFormData, awayTeamId: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.filter(team => team.id !== gameFormData.homeTeamId).map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editGameDate">Game Date *</Label>
                <Input
                  id="editGameDate"
                  type="date"
                  value={gameFormData.gameDate}
                  onChange={(e) => setGameFormData({...gameFormData, gameDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editGameTime">Game Time</Label>
                <Input
                  id="editGameTime"
                  type="time"
                  value={gameFormData.gameTime}
                  onChange={(e) => setGameFormData({...gameFormData, gameTime: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editCourtLocation">Court Location</Label>
              <Input
                id="editCourtLocation"
                value={gameFormData.courtLocation}
                onChange={(e) => setGameFormData({...gameFormData, courtLocation: e.target.value})}
                placeholder="Enter court or venue location"
              />
            </div>

            {gameFormData.status === 'completed' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editHomeTeamScore">Home Team Score</Label>
                  <Input
                    id="editHomeTeamScore"
                    type="number"
                    min="0"
                    value={gameFormData.homeTeamScore}
                    onChange={(e) => setGameFormData({...gameFormData, homeTeamScore: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editAwayTeamScore">Away Team Score</Label>
                  <Input
                    id="editAwayTeamScore"
                    type="number"
                    min="0"
                    value={gameFormData.awayTeamScore}
                    onChange={(e) => setGameFormData({...gameFormData, awayTeamScore: e.target.value})}
                    />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={gameFormData.notes}
                onChange={(e) => setGameFormData({...gameFormData, notes: e.target.value})}
                placeholder="Game notes (optional)"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditGameDialogOpen(false)
                  resetGameForm()
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