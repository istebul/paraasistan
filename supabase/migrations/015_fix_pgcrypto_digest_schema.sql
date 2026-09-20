DO $$
DECLARE
  v_function_sql text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO v_function_sql
  FROM pg_proc p
  JOIN pg_namespace n
    ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'redeem_pro_access_code'
    AND pg_get_function_identity_arguments(p.oid) = 'p_code text'
  LIMIT 1;

  IF v_function_sql IS NULL THEN
    RAISE EXCEPTION 'redeem_pro_access_code(text) bulunamadı.';
  END IF;

  v_function_sql := replace(
    v_function_sql,
    'digest(v_normalized_code,',
    'extensions.digest(v_normalized_code,'
  );

  EXECUTE v_function_sql;
END
$$;

REVOKE ALL
ON FUNCTION public.redeem_pro_access_code(text)
FROM public;

GRANT EXECUTE
ON FUNCTION public.redeem_pro_access_code(text)
TO authenticated;
