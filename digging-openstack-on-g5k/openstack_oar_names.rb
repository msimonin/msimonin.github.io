#!/usr/bin/env ruby

require 'pg'
require 'restfully'
require 'json'

patterns = %w('%openstack%' '%devstack%' '%fortytwo%' '%greenerbar%')
sites=%w(toulouse)

like = patterns.join(' or LOWER(job_name) like ')
like = " LOWER(job_name) like #{like}"

session = Restfully::Session.new(
    :configuration_file => '~/.restfully/api.grid5000.fr.yml')
allJobs = Hash.new{|h,k| h[k] = []}
sites.each do |site| 
  puts "---------------------------"
  puts "FETCHING jobids for #{site}"
  puts "---------------------------"
  conn = PG::Connection.open(
    :host     => "oardb.#{site}.grid5000.fr",
    :user     => 'oarreader',
    :password => 'read',
    :dbname   => 'oar2')

  res = conn.exec("select job_name, count(*) from jobs where #{like} group by job_name")
  limit = 50
  res.each do |r|
    puts r.inspect
    offset = 0
    jobs = session.root.sites[site.to_sym].jobs(:query => {:name => r["job_name"],:offset => offset, :limit =>limit})
    while jobs.count > 0 do
      jobs.each do |j|
        prop = j.self.properties
        prop["site"] = site
        allJobs[site] << prop.delete_if{ |key, _| key.to_s == "resources_by_type"}
      end
      puts "founds so far #{allJobs[site].size} jobs" 
      offset += limit
      jobs = session.root.sites[site.to_sym].jobs(:query => {:name => r["job_name"],:offset => offset, :limit => limit})
    end
  end
  File.open("openstack_#{site}.json","w") do |f|
      f.write(allJobs[site].to_json)
  end
end

