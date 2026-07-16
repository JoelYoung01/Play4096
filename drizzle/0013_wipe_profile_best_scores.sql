-- Reset denormalized profile high scores. All-time classic leaderboard now
-- aggregates from completed `game` rows instead of `user_profile.best_score`,
-- which could be inflated via unvalidated client sync.
UPDATE `user_profile` SET `best_score` = NULL;
