-- Direct authenticated access editing, atomic invitation sync, and audit. All fixtures roll back.
begin;
do $$
declare admin_id uuid=gen_random_uuid(); member_id uuid=gen_random_uuid(); saved jsonb; payload jsonb;
begin
  insert into public.officer_committee_invitations(email,name,is_admin,modules) values
    ('access-admin-qa@student.fatima.edu.ph','QA Administrator',true,array['members']),
    ('access-member-qa@student.fatima.edu.ph','QA Member',false,array['members']);
  insert into auth.users(id,email) values(admin_id,'access-admin-qa@student.fatima.edu.ph'),(member_id,'access-member-qa@student.fatima.edu.ph');
  payload=jsonb_build_object('name','  Updated Admin  ','organization_role','officer','is_admin',true,'active',true,'modules',jsonb_build_array('members','content','members'));
  perform set_config('request.jwt.claim.sub',admin_id::text,true); execute 'set local role authenticated';
  saved=public.save_portal_access(admin_id,payload);
  if saved->>'name'<>'Updated Admin' or saved->>'user_id'<>admin_id::text or not private.can('admin') then raise exception 'FAIL own name update'; end if;
  if not exists(select 1 from public.officer_committee_invitations where email='access-admin-qa@student.fatima.edu.ph' and name='Updated Admin' and modules=array['content','members']) then raise exception 'FAIL atomic invitation sync'; end if;
  begin perform public.save_portal_access(admin_id,payload||'{"is_admin":false}'); raise exception 'FAIL own demotion allowed'; exception when others then if sqlerrm not like '%cannot remove your own%' then raise; end if; end;
  begin perform public.save_portal_access(admin_id,payload||'{"active":false}'); raise exception 'FAIL own deactivation allowed'; exception when others then if sqlerrm not like '%cannot remove your own%' then raise; end if; end;
  begin perform public.save_portal_access(admin_id,payload||'{"name":" "}'); raise exception 'FAIL empty name allowed'; exception when others then if sqlerrm not like '%Enter a name%' then raise; end if; end;
  begin perform public.save_portal_access(admin_id,payload||'{"modules":["admin"]}'); raise exception 'FAIL invalid module allowed'; exception when others then if sqlerrm not like '%Invalid module%' then raise; end if; end;
  begin perform public.save_portal_access(admin_id,payload||'{"organization_role":"unknown"}'); raise exception 'FAIL invalid role allowed'; exception when others then if sqlerrm not like '%Check the account%' then raise; end if; end;
  saved=public.save_portal_access(member_id,payload||'{"name":"Updated Member","is_admin":false,"organization_role":"committee"}');
  if saved->>'organization_role'<>'committee' or (saved->>'is_admin')::boolean then raise exception 'FAIL target account update'; end if;
  begin update public.officers_and_committees set name='Bypass' where user_id=member_id; raise exception 'FAIL direct account writes'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  if not exists(select 1 from public.audit_log where actor_id=admin_id and record_id=admin_id::text and action='update' and reason like '%name%') then raise exception 'FAIL actor audit'; end if;
  perform set_config('request.jwt.claim.sub',member_id::text,true); execute 'set local role authenticated';
  begin perform public.save_portal_access(admin_id,payload); raise exception 'FAIL non-admin allowed'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  update public.officers_and_committees set is_admin=true,active=false where user_id=member_id;
  execute 'set local role authenticated';
  begin perform public.save_portal_access(admin_id,payload); raise exception 'FAIL inactive admin allowed'; exception when insufficient_privilege then null; end;
  execute 'reset role'; execute 'set local role anon';
  begin perform public.save_portal_access(admin_id,payload); raise exception 'FAIL anonymous allowed'; exception when insufficient_privilege then null; end;
  execute 'reset role';
end $$;
rollback;
