-- Run against the development project using execute_sql or psql. All fixtures roll back.
begin;
do $$
declare actor uuid=gen_random_uuid(); outsider uuid=gen_random_uuid(); opening uuid; tournament uuid; draft uuid; published uuid; a uuid; b uuid; c uuid; challenge uuid; application uuid; v_reference text; result jsonb; m public.matches; next_match public.matches; n int;
begin
  perform set_config('phoenix.reason','test fixtures',true);
  insert into public.officer_committee_invitations(email,name,modules) values('phoenix-test@student.fatima.edu.ph','Test officers_and_committees',array['content']);
  insert into auth.users(id,email) values(actor,'phoenix-test@student.fatima.edu.ph');
  if not exists(select 1 from public.officers_and_committees where user_id=actor and not is_admin and organization_role='officer') then raise exception 'FAIL: officer invitation provisioning'; end if;
  begin insert into auth.users(id,email) values(outsider,'uninvited@student.fatima.edu.ph'); raise exception 'FAIL: uninvited auth user allowed'; exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  begin insert into auth.users(id,email) values(outsider,'outside@example.com'); raise exception 'FAIL: external email allowed'; exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;

  insert into public.content(kind,slug,title,status) values('announcement','test-draft','Test draft','draft') returning id into draft;
  insert into public.content(kind,slug,title,status) values('announcement','test-published','Test published','published') returning id into published;
  insert into public.content(kind,slug,title,status,deadline) values('opening','test-opening','Test opening','open',now()+interval '1 hour') returning id into opening;
  perform set_config('test.draft',draft::text,true); perform set_config('test.published',published::text,true);
  execute 'set local role anon';
  if exists(select 1 from public.content where id=current_setting('test.draft')::uuid) then raise exception 'FAIL: anon reads draft'; end if;
  if not exists(select 1 from public.content where id=current_setting('test.published')::uuid) then raise exception 'FAIL: anon cannot read published'; end if;
  begin perform count(*) from public.applications; raise exception 'FAIL: anon reads private applications'; exception when insufficient_privilege then null; end;
  begin perform count(*) from public.teams; raise exception 'FAIL: anon reads private rosters'; exception when insufficient_privilege then null; end;
  begin perform public.email_limit('test',1,60); raise exception 'FAIL: anon invokes privileged RPC'; exception when insufficient_privilege then null; end;
  begin insert into public.content(kind,slug,title) values('announcement','test-unauthorized','Unauthorized'); raise exception 'FAIL: anon writes content'; exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  if not exists(select 1 from public.officers_and_committees where user_id=actor) then raise exception 'FAIL: officers_and_committees cannot read own access'; end if;
  if not exists(select 1 from public.content where id=draft) then raise exception 'FAIL: assigned officers_and_committees cannot read drafts'; end if;
  begin insert into public.members(name,category) values('Unauthorized','player'); raise exception 'FAIL: content officers_and_committees writes members'; exception when insufficient_privilege then null; end;
  begin update public.officers_and_committees set is_admin=true where user_id=actor; raise exception 'FAIL: officers_and_committees self-escalation'; exception when insufficient_privilege then null; end;
  begin perform public.portal_action('portal_access',actor,actor,'{}','test'); raise exception 'FAIL: authenticated invokes privileged RPC'; exception when insufficient_privilege then null; end;
  execute 'reset role'; perform set_config('request.jwt.claim.sub','',true);

  perform public.save_portal_invitation('committee-test@student.fatima.edu.ph','Test committee member',false,array['recruitment'],actor,'test committee invitation','committee');
  insert into auth.users(id,email) values(outsider,'committee-test@student.fatima.edu.ph');
  if not exists(select 1 from public.officers_and_committees where user_id=outsider and organization_role='committee') then raise exception 'FAIL: committee role provisioning'; end if;
  begin perform public.save_portal_invitation('invalid-role@student.fatima.edu.ph','Invalid role',false,'{}',actor,'test invalid role','player'); raise exception 'FAIL: invalid portal role'; exception when check_violation then null; end;
  perform public.portal_action('portal_access',outsider,actor,jsonb_build_object('name','Test officer','organization_role','officer','is_admin',false,'active',false,'modules',jsonb_build_array('recruitment')),'test role and access update');
  if not exists(select 1 from public.officers_and_committees where user_id=outsider and organization_role='officer' and not active) or not exists(select 1 from public.officer_committee_invitations where email='committee-test@student.fatima.edu.ph' and organization_role='officer' and not active) then raise exception 'FAIL: account/invitation role sync'; end if;
  perform set_config('request.jwt.claim.sub',outsider::text,true); execute 'set local role authenticated';
  if private.can('recruitment') then raise exception 'FAIL: deactivated account retains permission'; end if;
  execute 'reset role'; perform set_config('request.jwt.claim.sub','',true);

  challenge=public.create_challenge('applicant@student.fatima.edu.ph','application',opening,'correct');
  if public.verify_challenge(challenge,'wrong','grant') then raise exception 'FAIL: incorrect code accepted'; end if;
  if not public.verify_challenge(challenge,'correct','grant') then raise exception 'FAIL: valid code rejected'; end if;
  result=public.submit_verified(challenge,'grant','test-token',jsonb_build_object('name','Test applicant','student_number','TEST-001','course_year','Test course','experience','Test experience'));
  v_reference=result->>'reference';
  select id into application from public.applications where applications.reference=v_reference;
  if application is null then raise exception 'FAIL: verified submission missing'; end if;
  result=public.lookup_status('test-token');
  if result ? 'student_number' or result ? 'email' or result ? 'internal_notes' then raise exception 'FAIL: status exposes private fields'; end if;
  begin perform public.submit_verified(challenge,'grant','replay','{}'); raise exception 'FAIL: grant replay allowed'; exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  begin perform public.portal_action('review_application',application,actor,jsonb_build_object('status','accepted','campus_verified',false),'test eligibility'); raise exception 'FAIL: unverified acceptance'; exception when check_violation then null; end;
  perform public.portal_action('review_application',application,actor,jsonb_build_object('status','accepted','campus_verified',true,'internal_notes','Private test note','public_feedback','Accepted'),'test eligibility');
  perform public.portal_action('convert_member',application,actor,jsonb_build_object('category','player','position','Player'),'test conversion');
  begin perform public.portal_action('convert_member',application,actor,jsonb_build_object('category','player'),'duplicate conversion'); raise exception 'FAIL: duplicate member conversion'; exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  challenge=public.create_challenge('attempts@student.fatima.edu.ph','renew',null,'correct');
  for n in 1..5 loop perform public.verify_challenge(challenge,'wrong','grant'); end loop;
  if public.verify_challenge(challenge,'correct','grant') then raise exception 'FAIL: attempt limit bypass'; end if;
  challenge=public.create_challenge('expired@student.fatima.edu.ph','renew',null,'correct');
  update private.email_challenges set expires_at=now()-interval '1 second' where id=challenge;
  if public.verify_challenge(challenge,'correct','grant') then raise exception 'FAIL: expired code accepted'; end if;
  if not public.email_limit('test-limit',1,60) or public.email_limit('test-limit',1,60) then raise exception 'FAIL: rate limit'; end if;
  update private.status_tokens set expires_at=now()-interval '1 second' where token_hash='test-token';
  begin perform public.lookup_status('test-token'); raise exception 'FAIL: expired status accepted'; exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  challenge=public.create_challenge('applicant@student.fatima.edu.ph','renew',null,'renew');
  perform public.verify_challenge(challenge,'renew','renew-grant');
  perform public.renew_status(challenge,'renew-grant',v_reference,'renew-token');
  result=public.lookup_status('renew-token');
  if result->>'reference'<>v_reference then raise exception 'FAIL: status renewal'; end if;

  raise notice 'PASS: invitation/domain guards, RLS, recruitment verification, replay, expiry, renewal, acceptance and conversion';
end $$;
rollback;
