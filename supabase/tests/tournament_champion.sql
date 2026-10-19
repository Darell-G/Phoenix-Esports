-- Manual champions remain independent of standings. All fixtures roll back.
begin;
do $$
declare actor uuid=gen_random_uuid(); limited uuid=gen_random_uuid(); tournament uuid; data jsonb;
begin
  insert into public.officer_committee_invitations(email,name,modules) values('champion-test@student.fatima.edu.ph','Champion test',array['tournaments']);
  insert into auth.users(id,email) values(actor,'champion-test@student.fatima.edu.ph');
  insert into public.officer_committee_invitations(email,name,modules) values('champion-limited@student.fatima.edu.ph','Limited test',array['members']);
  insert into auth.users(id,email) values(limited,'champion-limited@student.fatima.edu.ph');
  insert into public.content(kind,slug,title,status) values('tournament','champion-template','Champion test','draft') returning to_jsonb(content.*) into data;
  perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  tournament=public.save_content(null,data||jsonb_build_object('champion_name','  Team Alpha  '),'');
  if not exists(select 1 from public.content where id=tournament and champion_name='Team Alpha') then raise exception 'FAIL champion creation/normalization'; end if;
  perform public.save_content(tournament,jsonb_build_object('champion_name','Team Beta'),'');
  if not exists(select 1 from public.content where id=tournament and champion_name='Team Beta') then raise exception 'FAIL champion correction'; end if;
  begin perform public.save_content(tournament,jsonb_build_object('champion_name',repeat('x',181)),''); raise exception 'FAIL champion length'; exception when check_violation then null; end;
  execute 'reset role'; execute 'set local role anon';
  if exists(select 1 from public.content where id=tournament) then raise exception 'FAIL private champion visible'; end if;
  begin perform public.save_content(tournament,jsonb_build_object('champion_name','Unauthorized'),''); raise exception 'FAIL anonymous champion edit'; exception when others then if sqlstate<>'42501' and sqlerrm not like '%access denied%' then raise; end if; end;
  execute 'reset role'; perform set_config('request.jwt.claim.sub',limited::text,true); execute 'set local role authenticated';
  begin perform public.save_content(tournament,jsonb_build_object('champion_name','Unauthorized'),''); raise exception 'FAIL unauthorized champion edit'; exception when others then if sqlstate<>'42501' and sqlerrm not like '%access denied%' then raise; end if; end;
  execute 'reset role'; perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  perform public.save_content(tournament,jsonb_build_object('status','published'),'');
  execute 'reset role'; execute 'set local role anon';
  if not exists(select 1 from public.content where id=tournament and champion_name='Team Beta') then raise exception 'FAIL published champion visibility'; end if;
  execute 'reset role'; perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  perform public.save_content(tournament,jsonb_build_object('champion_name',''),'');
  if not exists(select 1 from public.content where id=tournament and champion_name='') then raise exception 'FAIL champion removal'; end if;
  execute 'reset role';
  if not exists(select 1 from public.audit_log where record_id=tournament::text and actor_id=actor and reason like '%champion name%') then raise exception 'FAIL champion audit'; end if;
  if exists(select 1 from public.tournament_scoreboard where tournament_id=tournament) then raise exception 'FAIL champion changed standings'; end if;
end $$;
rollback;
