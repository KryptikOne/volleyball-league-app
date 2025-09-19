'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaguesManagement } from './leagues-management'
import { SeasonsManagement } from './seasons-management'
import { TeamsManagement } from './teams-management'
import { GamesManagement } from './games-management'
import { PlayoffsManagement } from './playoffs-management'
import { Trophy, Calendar, Users, Volleyball, Award } from 'lucide-react'

export function LeagueAdminTabs() {
  const [activeTab, setActiveTab] = useState('leagues')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-8">
        <TabsTrigger value="leagues" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Leagues
        </TabsTrigger>
        <TabsTrigger value="seasons" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Seasons
        </TabsTrigger>
        <TabsTrigger value="teams" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Teams
        </TabsTrigger>
        <TabsTrigger value="games" className="flex items-center gap-2">
          <Volleyball className="h-4 w-4" />
          Games
        </TabsTrigger>
        <TabsTrigger value="playoffs" className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Playoffs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="leagues" className="space-y-6">
        <LeaguesManagement />
      </TabsContent>

      <TabsContent value="seasons" className="space-y-6">
        <SeasonsManagement />
      </TabsContent>

      <TabsContent value="teams" className="space-y-6">
        <TeamsManagement />
      </TabsContent>

      <TabsContent value="games" className="space-y-6">
        <GamesManagement />
      </TabsContent>

      <TabsContent value="playoffs" className="space-y-6">
        <PlayoffsManagement />
      </TabsContent>
    </Tabs>
  )
}