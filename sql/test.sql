select len,fulllen,
       --geojson,
       components as components,detector_id as detector_id,refnum as freeway,direction as direction,
       extract( epoch from ( GREATEST (to_timestamp(1325404800),dsc.ts)) ) as ts,
       extract( epoch from ( LEAST (to_timestamp(1357027200),dsc.endts)) ) as endts
FROM (
   select components,detector_id,refnum,direction
          ,st_length(st_transform(snipgeom,32611)) * 0.000621371192 as len
          ,st_length(st_transform(fullgeom,32611)) * 0.000621371192 as fulllen
          --,st_asgeojson(ST_Simplify(snipgeom,1e-14),14) as geojson
          --,st_asgeojson(ST_Simplify(fullgeom,1e-14),14) as fullgeojson
  FROM (
     select vdsg.*
            ,(ST_Dump(ST_Intersection(area.geom,seggeom))).geom as snipgeom
            ,seggeom as fullgeom
      FROM tempseg.versioned_detector_segment_geometry vdsg
      join tempseg.tdetector ttd ON (vdsg.detector_id=ttd.detector_id and
                                     osm_upgrade.canonical_direction(vdsg.direction)=osm_upgrade.canonical_direction(ttd.direction)
                                     and vdsg.refnum=ttd.refnum)
      join (
         select geom4326 as geom
         from public.carb_counties_aligned_03
         join counties_fips a on (carb_counties_aligned_03.name ~* a.name)
         where fips='06001' ) as area
         ON (st_intersects(seggeom,area.geom)
    )
    WHERE   ttd.geom && area.geom
  )pickgeom
)lengthsgeom
JOIN tempseg.reduced_detector_segment_conditions dsc USING (components,direction)
WHERE
endts >= to_timestamp(1325404800) and ts <  to_timestamp(1357027200)
 and
 round ( extract( epoch from (
      (   LEAST  (to_timestamp(1357027200),dsc.endts))
    - ( GREATEST (to_timestamp(1325404800),dsc.ts))
 ) ) / 3600 ) >= 1
order by dsc.ts



with
area as (
  select geom4326 as geom
  from carbgrid.state4k
  where i_cell= 189  and j_cell= 72
  ),
pickgeom as (
  select vdsg.*
    ,(ST_Dump(ST_Intersection(area.geom,seggeom))).geom as snipgeom
    ,seggeom as fullgeom
    FROM tempseg.versioned_detector_segment_geometry vdsg
    JOIN tempseg.tdetector ttd ON (vdsg.detector_id=ttd.detector_id
         and osm_upgrade.canonical_direction(vdsg.direction)=
             osm_upgrade.canonical_direction(ttd.direction)
         and vdsg.refnum=ttd.refnum)
    join area ON (st_intersects(seggeom,area.geom))
    WHERE   ttd.geom && area.geom
),
lengthsgeom as (
  select components,detector_id,refnum,direction
        ,st_length(st_transform(snipgeom,32611)) * 0.000621371192 as len
        ,st_length(st_transform(fullgeom,32611)) * 0.000621371192 as fulllen
        ,st_asgeojson(ST_Simplify(snipgeom,1e-14),14) as geojson
        ,st_asgeojson(ST_Simplify(fullgeom,1e-14),14) as fullgeojson
  FROM pickgeom
)
select len,fulllen,components as components,detector_id as detector_id,refnum as freeway,direction as direction,extract( epoch from ( GREATEST (to_timestamp(1325404800),dsc.ts)) ) as ts,extract( epoch from ( LEAST (to_timestamp(1357027200),dsc.endts)) ) as endts,dsc.ts as dscts, dsc.endts as dscendts
FROM lengthsgeom
JOIN tempseg2.detector_segment_conditions dsc USING (components,direction)
WHERE
endts >= to_timestamp(1325404800) and ts <  to_timestamp(1357027200)
 and round ( extract( epoch from (
      (   LEAST  (to_timestamp(1357027200),dsc.endts))
    - ( GREATEST (to_timestamp(1325404800),dsc.ts))
 ) ) / 3600 ) >= 1
order by dsc.ts

select len,fulllen,geojson,components as components,detector_id as detector_id,refnum as freeway,direction as direction,extract( epoch from ( GREATEST (to_timestamp(1325404800),dsc.ts)) ) as ts,extract( epoch from ( LEAST (to_timestamp(1357027200),dsc.endts)) ) as endts
FROM lengthsgeom
JOIN tempseg.reduced_detector_segment_conditions dsc USING (components,direction)
WHERE
endts >= to_timestamp(1325404800) and ts <  to_timestamp(1357027200)
 and round ( extract( epoch from (
      (   LEAST  (to_timestamp(1357027200),dsc.endts))
    - ( GREATEST (to_timestamp(1325404800),dsc.ts))
 ) ) / 3600 ) >= 1
order by dsc.ts
