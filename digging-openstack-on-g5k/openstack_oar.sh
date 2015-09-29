#!/usr/bin/env bash
set -x
site='rennes toulouse grenoble nancy sophia lyon reims lille luxembourg'
like="job_name like '%openstack%' or job_name like 'FortyTwo' or job_name like 'GreenerBar'"
for i in $site
do
   PGPASSWORD=read psql -h oardb.$i.grid5000.fr -U oarreader oar2 -c "\
     select * \
     from jobs limit 1;"
done
#for i in $site
#do
#  mysql --host=mysql.$i.grid5000.fr -u oarreader --password=read oar2 -e 'select count(*) from jobs where job_name="openstack";'
#done

#start=$(date -d "2015-01-01 00:00:00" +%s)
#for i in $site
#do
#  mysql --host=mysql.$i.grid5000.fr -u oarreader --password=read oar2 -e "select count(*) from jobs where job_name like '%harness%' and start_time >= $start;"
#done


