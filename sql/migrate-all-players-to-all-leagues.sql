-- One-time migration: initially enable every existing player in every active league
-- for each season in which the player already has an assignment.
insert into player_assignments (
  player_id, season_id, squad_id, jersey_number, position, featured, roster_order, status
)
select distinct on (existing.player_id, existing.season_id, squads.id)
  existing.player_id,
  existing.season_id,
  squads.id,
  existing.jersey_number,
  existing.position,
  existing.featured,
  existing.roster_order,
  existing.status
from player_assignments existing
cross join squads
where squads.is_active = true
order by existing.player_id, existing.season_id, squads.id, existing.squad_id
on conflict (player_id, season_id, squad_id) do nothing;
