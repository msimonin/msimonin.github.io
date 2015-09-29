#!/usr/bin/env ruby

require 'pg'
require 'restfully'
require 'json'

patterns = %w('%openstack%' '%devstack%' '%fortytwo%' '%greenerbar%')
sites=%w(nantes rennes lyon toulouse nancy sophia reims grenoble lille luxembourg)

res = {}
jobs = []
ids = []

like = patterns.join(' or LOWER(job_name) like ')
like = " LOWER(job_name) like #{like}"

sites.each do |site| 
  conn = PG::Connection.open(
    :host     => "oardb.#{site}.grid5000.fr",
    :user     => 'oarreader',
    :password => 'read',
    :dbname   => 'oar2')

  res = conn.exec("select job_id from jobs where #{like}")
  res.each do |r|
    id = { :site => site, :id => r["job_id"]}
    puts "got ... #{id}"
    ids << id
  end
end

session = Restfully::Session.new(
    :configuration_file => '~/.restfully/api.grid5000.fr.yml')

ids.each do |i|
    puts "fetching ... #{i}"
    j = session.root.sites[i[:site].to_sym].jobs[i[:id].to_sym].properties
    j["site"] = i[:site]
    # delete from keys (size issue)
    jobs << j.delete_if{ |key, _| key.to_s == "resources_by_type"}
end


File.open("openstack.json","w") do |f|
    f.write(jobs.to_json)
end



