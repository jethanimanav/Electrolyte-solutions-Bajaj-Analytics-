--
-- PostgreSQL database dump
--

\restrict M7Qio2wEae3W9Lgmd8DNOcwTJXljPcf4eOPgA8Qe6WmBduI0wAE9rKSOFQD1UDg

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bom (
    id integer NOT NULL,
    part_code character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bom OWNER TO postgres;

--
-- Name: bom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_id_seq OWNER TO postgres;

--
-- Name: bom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bom_id_seq OWNED BY public.bom.id;


--
-- Name: consolidated_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consolidated_data (
    id integer NOT NULL,
    sr_no character varying(255),
    dc_no character varying(255),
    dc_date date,
    branch character varying(255),
    bccd_name character varying(255),
    product_description text,
    product_sr_no character varying(255),
    date_of_purchase date,
    complaint_no character varying(255),
    part_code character varying(255),
    defect text,
    visiting_tech_name character varying(255),
    mfg_month_year character varying(255),
    repair_date date,
    testing character varying(50),
    failure character varying(50),
    status character varying(50),
    pcb_sr_no character varying(255),
    rf_observation text,
    analysis text,
    validation_result text,
    component_change text,
    engg_name character varying(255),
    tag_entry_by character varying(255),
    consumption_entry_by character varying(255),
    dispatch_entry_by character varying(255),
    dispatch_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.consolidated_data OWNER TO postgres;

--
-- Name: consolidated_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consolidated_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consolidated_data_id_seq OWNER TO postgres;

--
-- Name: consolidated_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consolidated_data_id_seq OWNED BY public.consolidated_data.id;


--
-- Name: dc_numbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dc_numbers (
    id integer NOT NULL,
    dc_number character varying(255) NOT NULL,
    part_codes jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dc_numbers OWNER TO postgres;

--
-- Name: dc_numbers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dc_numbers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dc_numbers_id_seq OWNER TO postgres;

--
-- Name: dc_numbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dc_numbers_id_seq OWNED BY public.dc_numbers.id;


--
-- Name: engineers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.engineers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.engineers OWNER TO postgres;

--
-- Name: engineers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.engineers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.engineers_id_seq OWNER TO postgres;

--
-- Name: engineers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.engineers_id_seq OWNED BY public.engineers.id;


--
-- Name: sheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sheets (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sheets OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supabase_user_id text NOT NULL,
    email text NOT NULL,
    name text,
    role text DEFAULT 'USER'::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: bom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom ALTER COLUMN id SET DEFAULT nextval('public.bom_id_seq'::regclass);


--
-- Name: consolidated_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidated_data ALTER COLUMN id SET DEFAULT nextval('public.consolidated_data_id_seq'::regclass);


--
-- Name: dc_numbers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dc_numbers ALTER COLUMN id SET DEFAULT nextval('public.dc_numbers_id_seq'::regclass);


--
-- Name: engineers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.engineers ALTER COLUMN id SET DEFAULT nextval('public.engineers_id_seq'::regclass);


--
-- Name: bom bom_part_code_location_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_part_code_location_key UNIQUE (part_code, location);


--
-- Name: bom bom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bom
    ADD CONSTRAINT bom_pkey PRIMARY KEY (id);


--
-- Name: consolidated_data consolidated_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidated_data
    ADD CONSTRAINT consolidated_data_pkey PRIMARY KEY (id);


--
-- Name: consolidated_data consolidated_data_product_sr_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consolidated_data
    ADD CONSTRAINT consolidated_data_product_sr_no_key UNIQUE (product_sr_no);


--
-- Name: dc_numbers dc_numbers_dc_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dc_numbers
    ADD CONSTRAINT dc_numbers_dc_number_key UNIQUE (dc_number);


--
-- Name: dc_numbers dc_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dc_numbers
    ADD CONSTRAINT dc_numbers_pkey PRIMARY KEY (id);


--
-- Name: engineers engineers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.engineers
    ADD CONSTRAINT engineers_name_key UNIQUE (name);


--
-- Name: engineers engineers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.engineers
    ADD CONSTRAINT engineers_pkey PRIMARY KEY (id);


--
-- Name: sheets sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sheets
    ADD CONSTRAINT sheets_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_supabase_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_supabase_user_id_key UNIQUE (supabase_user_id);


--
-- Name: idx_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email ON public.users USING btree (email);


--
-- Name: idx_engineer_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_engineer_name ON public.engineers USING btree (name);


--
-- Name: idx_supabase_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supabase_user_id ON public.users USING btree (supabase_user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict M7Qio2wEae3W9Lgmd8DNOcwTJXljPcf4eOPgA8Qe6WmBduI0wAE9rKSOFQD1UDg

