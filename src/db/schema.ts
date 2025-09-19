import { pgTable, uuid, varchar, text, boolean, timestamp, integer, date, time, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const users = pgTable('users', {
  id: uuid('user_id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 15 }),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  gender: varchar('gender', { length: 20 }),
  heightInches: integer('height_inches'),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 15 }),
  availability: text('availability'),
  skillLevel: varchar('skill_level', { length: 20 }),
  isAdministrator: boolean('is_administrator').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const leagues = pgTable('leagues', {
  id: uuid('league_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  administratorId: uuid('administrator_id').notNull().references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const seasons = pgTable('seasons', {
  id: uuid('season_id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  registrationStartDate: date('registration_start_date'),
  registrationEndDate: date('registration_end_date'),
  maxTeams: integer('max_teams'),
  gameDurationMinutes: integer('game_duration_minutes').default(60),
  playoffFormat: varchar('playoff_format', { length: 50 }).default('single_elimination'),
  isActive: boolean('is_active').notNull().default(true),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const teams = pgTable('teams', {
  id: uuid('team_id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  teamCode: varchar('team_code', { length: 10 }).unique().notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  captainId: uuid('captain_id').references(() => users.id),
  maxRosterSize: integer('max_roster_size').default(12),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  pointsFor: integer('points_for').default(0),
  pointsAgainst: integer('points_against').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const teamPlayers = pgTable('team_players', {
  id: uuid('team_player_id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jerseyNumber: integer('jersey_number'),
  position: varchar('position', { length: 30 }),
  playerType: varchar('player_type', { length: 20 }).default('player'),
  joinedDate: timestamp('joined_date').defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
})

export const games = pgTable('games', {
  id: uuid('game_id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  homeTeamId: uuid('home_team_id').notNull().references(() => teams.id),
  awayTeamId: uuid('away_team_id').notNull().references(() => teams.id),
  gameDate: date('game_date').notNull(),
  gameTime: time('game_time'),
  courtLocation: varchar('court_location', { length: 255 }),
  gameType: varchar('game_type', { length: 20 }).default('regular'),
  status: varchar('status', { length: 20 }).default('scheduled'),
  homeTeamScore: integer('home_team_score').default(0),
  awayTeamScore: integer('away_team_score').default(0),
  forfeitTeamId: uuid('forfeit_team_id').references(() => teams.id),
  notes: text('notes'),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const gameSets = pgTable('game_sets', {
  id: uuid('set_id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  homeTeamScore: integer('home_team_score').default(0),
  awayTeamScore: integer('away_team_score').default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  durationMinutes: integer('duration_minutes'),
})

export const playerStats = pgTable('player_stats', {
  id: uuid('stat_id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  kills: integer('kills').default(0),
  attacks: integer('attacks').default(0),
  attackErrors: integer('attack_errors').default(0),
  assists: integer('assists').default(0),
  aces: integer('aces').default(0),
  serviceErrors: integer('service_errors').default(0),
  digs: integer('digs').default(0),
  blocks: integer('blocks').default(0),
  blockErrors: integer('block_errors').default(0),
  receptionErrors: integer('reception_errors').default(0),
  createdDate: timestamp('created_date').defaultNow(),
})

// Playoff Brackets Table
export const playoffBrackets = pgTable('playoff_brackets', {
  id: uuid('bracket_id').primaryKey().defaultRandom(),
  seasonId: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  bracketType: varchar('bracket_type', { length: 30 }).notNull().default('single_elimination'), // 'single_elimination', 'double_elimination', 'round_robin'
  status: varchar('status', { length: 20 }).notNull().default('setup'), // 'setup', 'in_progress', 'completed'
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

// Playoff Teams Table (Teams participating in a specific bracket)
export const playoffTeams = pgTable('playoff_teams', {
  id: uuid('playoff_team_id').primaryKey().defaultRandom(),
  playoffBracketId: uuid('playoff_bracket_id').notNull().references(() => playoffBrackets.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  seed: integer('seed').notNull(), // 1 = best seed, 2 = second best, etc.
  isActive: boolean('is_active').notNull().default(true),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

// Playoff Games Table (Individual games within a playoff bracket)
export const playoffGames = pgTable('playoff_games', {
  id: uuid('playoff_game_id').primaryKey().defaultRandom(),
  playoffBracketId: uuid('playoff_bracket_id').notNull().references(() => playoffBrackets.id, { onDelete: 'cascade' }),
  round: integer('round').notNull(), // 1 = first round, 2 = second round, etc.
  position: integer('position').notNull(), // Position within the round
  homeTeamId: uuid('home_team_id').references(() => teams.id),
  awayTeamId: uuid('away_team_id').references(() => teams.id),
  winnerId: uuid('winner_id').references(() => teams.id),
  gameDate: date('game_date'),
  gameTime: time('game_time'),
  courtLocation: varchar('court_location', { length: 255 }),
  status: varchar('status', { length: 20 }).default('scheduled'), // Reuse your existing game status values
  homeTeamScore: integer('home_team_score').default(0),
  awayTeamScore: integer('away_team_score').default(0),
  notes: text('notes'),
  createdDate: timestamp('created_date').defaultNow(),
  updatedDate: timestamp('updated_date').defaultNow(),
})

export const leagueAdministrators = pgTable('league_administrators', {
  id: uuid('admin_id').primaryKey().defaultRandom(),
  leagueId: uuid('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 30 }).default('admin'),
  grantedDate: timestamp('granted_date').defaultNow(),
  grantedBy: uuid('granted_by').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
})

export const activityLogs = pgTable('activity_logs', {
  id: uuid('log_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 50 }),
  recordId: uuid('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdDate: timestamp('created_date').defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  leagues: many(leagues),
  teamPlayers: many(teamPlayers),
  playerStats: many(playerStats),
  leagueAdministrators: many(leagueAdministrators),
}))

export const leaguesRelations = relations(leagues, ({ one, many }) => ({
  administrator: one(users, {
    fields: [leagues.administratorId],
    references: [users.id],
  }),
  seasons: many(seasons),
  leagueAdministrators: many(leagueAdministrators),
}))

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  league: one(leagues, {
    fields: [seasons.leagueId],
    references: [leagues.id],
  }),
  teams: many(teams),
  games: many(games),
  playoffBrackets: many(playoffBrackets),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  season: one(seasons, {
    fields: [teams.seasonId],
    references: [seasons.id],
  }),
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id],
  }),
  teamPlayers: many(teamPlayers),
  homeGames: many(games, {
    relationName: 'homeTeam',
  }),
  awayGames: many(games, {
    relationName: 'awayTeam',
  }),
  playoffTeams: many(playoffTeams),
  playoffHomeGames: many(playoffGames, { relationName: 'playoffHomeTeam' }),
  playoffAwayGames: many(playoffGames, { relationName: 'playoffAwayTeam' }),
  playoffWins: many(playoffGames, { relationName: 'playoffWinner' }),
}))

export const teamPlayersRelations = relations(teamPlayers, ({ one }) => ({
  team: one(teams, {
    fields: [teamPlayers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamPlayers.userId],
    references: [users.id],
  }),
}))

export const gamesRelations = relations(games, ({ one, many }) => ({
  season: one(seasons, {
    fields: [games.seasonId],
    references: [seasons.id],
  }),
  homeTeam: one(teams, {
    fields: [games.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [games.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  gameSets: many(gameSets),
  playerStats: many(playerStats),
}))

// Playoff Brackets Relations
export const playoffBracketsRelations = relations(playoffBrackets, ({ one, many }) => ({
  season: one(seasons, {
    fields: [playoffBrackets.seasonId],
    references: [seasons.id],
  }),
  playoffTeams: many(playoffTeams),
  playoffGames: many(playoffGames),
}))

// Playoff Teams Relations
export const playoffTeamsRelations = relations(playoffTeams, ({ one }) => ({
  playoffBracket: one(playoffBrackets, {
    fields: [playoffTeams.playoffBracketId],
    references: [playoffBrackets.id],
  }),
  team: one(teams, {
    fields: [playoffTeams.teamId],
    references: [teams.id],
  }),
}))

// Playoff Games Relations
export const playoffGamesRelations = relations(playoffGames, ({ one }) => ({
  playoffBracket: one(playoffBrackets, {
    fields: [playoffGames.playoffBracketId],
    references: [playoffBrackets.id],
  }),
  homeTeam: one(teams, {
    fields: [playoffGames.homeTeamId],
    references: [teams.id],
    relationName: 'playoffHomeTeam',
  }),
  awayTeam: one(teams, {
    fields: [playoffGames.awayTeamId],
    references: [teams.id],
    relationName: 'playoffAwayTeam',
  }),
  winner: one(teams, {
    fields: [playoffGames.winnerId],
    references: [teams.id],
    relationName: 'playoffWinner',
  }),
}))

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  passwordHash: z.string().min(8, 'Password must be at least 8 characters'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).optional(),
  heightInches: z.number().min(48).max(96).optional(),
  phone: z.string().regex(/^[+]?[\d\s\-()]{7,20}$/).optional(),
  isAdministrator: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
  passwordHash: true,
})

export const selectUserSchema = createSelectSchema(users)
export const publicUserSchema = selectUserSchema.omit({ passwordHash: true })

export const insertLeagueSchema = createInsertSchema(leagues, {
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})

export const insertSeasonSchema = createInsertSchema(seasons, {
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  registrationStartDate: z.string().transform((str) => new Date(str)).optional(),
  registrationEndDate: z.string().transform((str) => new Date(str)).optional(),
  playoffFormat: z.enum(['single_elimination', 'double_elimination', 'round_robin']).optional(),
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})

export const insertTeamSchema = createInsertSchema(teams, {
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  teamCode: true,
  wins: true,
  losses: true,
  pointsFor: true,
  pointsAgainst: true,
  createdDate: true,
  updatedDate: true,
})

export const insertGameSchema = createInsertSchema(games, {
  gameDate: z.string().transform((str) => new Date(str)),
  gameType: z.enum(['regular', 'playoff', 'championship']).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).optional(),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})

export const insertPlayoffBracketSchema = createInsertSchema(playoffBrackets, {
  bracketType: z.enum(['single_elimination', 'double_elimination', 'round_robin']),
  status: z.enum(['setup', 'in_progress', 'completed']).default('setup'),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})

export const insertPlayoffTeamSchema = createInsertSchema(playoffTeams, {
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})

export const insertPlayoffGameSchema = createInsertSchema(playoffGames, {
  gameDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']).default('scheduled'),
}).omit({
  id: true,
  createdDate: true,
  updatedDate: true,
})


export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type League = typeof leagues.$inferSelect
export type Season = typeof seasons.$inferSelect
export type Team = typeof teams.$inferSelect
export type Game = typeof games.$inferSelect
export type PlayoffBracket = typeof playoffBrackets.$inferSelect
export type NewPlayoffBracket = typeof playoffBrackets.$inferInsert
export type PlayoffTeam = typeof playoffTeams.$inferSelect
export type PlayoffGame = typeof playoffGames.$inferSelect