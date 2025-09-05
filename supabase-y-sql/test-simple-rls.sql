-- TEST SIMPLE: Ver si RLS está habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('posts', 'profiles');
