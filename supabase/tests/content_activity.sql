-- Content editing/deletion and automatic audit regression. All fixtures roll back.
begin;
do $$
declare actor uuid=gen_random_uuid(); limited uuid=gen_random_uuid(); product uuid; restricted uuid; opening uuid; data jsonb; stable_slug text;
begin
  perform set_config('phoenix.reason','Test setup',true);
  insert into public.officer_committee_invitations(email,name,modules) values('content-regression@student.fatima.edu.ph','Content test',array['content','recruitment']);
  insert into auth.users(id,email) values(actor,'content-regression@student.fatima.edu.ph');
  insert into public.officer_committee_invitations(email,name,modules) values('limited-regression@student.fatima.edu.ph','Limited test',array['members']);
  insert into auth.users(id,email) values(limited,'limited-regression@student.fatima.edu.ph');
  insert into public.content(kind,slug,title,status) values('product','regression-template','Product template','draft') returning to_jsonb(content.*) into data;
  perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  product=public.save_content(null,data||jsonb_build_object('title','Test jersey','status','published'),'');
  if not exists(select 1 from public.content where id=product and kind='product' and slug ~ '^test-jersey-[a-f0-9]+$') then raise exception 'FAIL product create or generated slug'; end if;
  select slug into stable_slug from public.content where id=product;
  perform public.save_content(product,jsonb_build_object('title','Updated jersey','price',500),'');
  if not exists(select 1 from public.content where id=product and kind='product' and slug=stable_slug and price=500) then raise exception 'FAIL product edit or URL stability'; end if;
  perform public.save_content(product,jsonb_build_object('kind','announcement'),'');
  perform public.save_content(product,jsonb_build_object('kind','product'),'');
  if not exists(select 1 from public.content where id=product and kind='product') then raise exception 'FAIL return content type to product'; end if;
  restricted=public.save_content(null,data||jsonb_build_object('title','Protected product'),'');
  execute 'reset role';
  if not exists(select 1 from public.audit_log where record_id=product::text and actor_id=actor and reason like 'Updated product:%') then raise exception 'FAIL automatic product activity'; end if;
  perform set_config('request.jwt.claim.sub',limited::text,true); execute 'set local role authenticated';
  begin perform public.delete_content(restricted); raise exception 'FAIL unauthorized delete'; exception when insufficient_privilege then null; end;
  begin perform public.save_content(restricted,jsonb_build_object('title','Unauthorized'),''); raise exception 'FAIL unauthorized content edit'; exception when others then if sqlerrm not like '%access denied%' and sqlstate<>'42501' then raise; end if; end;
  execute 'reset role'; execute 'set local role anon';
  begin perform public.delete_content(restricted); raise exception 'FAIL anonymous delete'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  insert into public.content(kind,slug,title,status) values('opening','protected-recruitment-test','Protected opening','draft') returning id into opening;
  insert into public.applications(opening_id,email,name,student_number,course_year) values(opening,'fixture@student.fatima.edu.ph','Fixture student','TEST-CONTENT','Test course');
  perform set_config('request.jwt.claim.sub',actor::text,true); execute 'set local role authenticated';
  begin perform public.delete_content(opening); raise exception 'FAIL deleted opening with applications'; exception when others then if sqlerrm not like '%Archive it instead%' then raise; end if; end;
  perform public.delete_content(product);
  if exists(select 1 from public.content where id=product) then raise exception 'FAIL delete content'; end if;
  execute 'reset role';
  if not exists(select 1 from public.audit_log where record_id=product::text and actor_id=actor and action='delete' and reason like 'Deleted product:%') then raise exception 'FAIL deletion audit'; end if;
end $$;
rollback;
