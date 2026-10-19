-- All fixtures and writes roll back; no actual image files are created or removed.
begin;
do $$
declare editor_id uuid=gen_random_uuid(); other_id uuid=gen_random_uuid(); object_id uuid=gen_random_uuid(); affected int;
begin
  insert into public.officer_committee_invitations(email,name,modules) values
    ('storage-editor-qa@student.fatima.edu.ph','QA Editor',array['content']),
    ('storage-other-qa@student.fatima.edu.ph','QA Other',array['content']);
  insert into auth.users(id,email) values(editor_id,'storage-editor-qa@student.fatima.edu.ph'),(other_id,'storage-other-qa@student.fatima.edu.ph');
  insert into storage.objects(id,bucket_id,name,owner_id) values(object_id,'editorial',editor_id::text||'/security-qa.png',editor_id::text);
  perform set_config('request.jwt.claim.sub',editor_id::text,true); execute 'set local role authenticated';
  update storage.objects set user_metadata='{"qa":true}' where id=object_id;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'FAIL active editor cannot update own upload'; end if;
  begin
    insert into storage.objects(bucket_id,name,owner_id) values('editorial',other_id::text||'/forbidden.png',editor_id::text);
    raise exception 'FAIL upload outside own folder allowed';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',other_id::text,true); execute 'set local role authenticated';
  update storage.objects set user_metadata='{"qa":false}' where id=object_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL editor changed another owner upload'; end if;
  execute 'reset role';
  update public.officers_and_committees set modules='{}' where user_id=editor_id;
  perform set_config('request.jwt.claim.sub',editor_id::text,true); execute 'set local role authenticated';
  update storage.objects set user_metadata='{"qa":false}' where id=object_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL revoked module retained owner update'; end if;
  execute 'reset role';
  update public.officers_and_committees set modules=array['content'],active=false where user_id=editor_id;
  execute 'set local role authenticated';
  update storage.objects set user_metadata='{"qa":false}' where id=object_id;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL inactive account retained owner update'; end if;
  execute 'reset role';
  -- DELETE has the same permission expression as UPDATE; assert that invariant
  -- without triggering Storage's service-only physical-delete guard.
  if (select qual from pg_policies where schemaname='storage' and tablename='objects' and policyname='editorial_delete')
    is distinct from (select qual from pg_policies where schemaname='storage' and tablename='objects' and policyname='editorial_update')
    then raise exception 'FAIL delete permission diverges from tested update permission'; end if;
end $$;
rollback;
