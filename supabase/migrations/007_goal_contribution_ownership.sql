-- Goal contributions must belong to a goal owned by the same user.

drop policy if exists "Users can manage own goal contributions"
  on public.goal_contributions;

create policy "Users can manage own goal contributions"
  on public.goal_contributions
  for all
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.goals
      where public.goals.id = goal_contributions.goal_id
        and public.goals.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.goals
      where public.goals.id = goal_contributions.goal_id
        and public.goals.user_id = auth.uid()
    )
  );
