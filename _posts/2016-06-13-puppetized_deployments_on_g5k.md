---
layout: post
title:  "Puppetized environment on Grid'5000"
date:   2016-06-13 10:30:00
categories:
---

Lately, the project [xp5k-openstack](https://github.com/grid5000/xp5k-openstack) has been
released.  It deploys OpenStack on [Grid'5000](https://www.grid5000.fr) and act as a wrapper around two
main components :

* The Grid'5000 REST API
* The Openstack Puppet modules

Under the hood it uses Rake to describe the deployment workflow.

## Openstack generic deployment

The project offers to the Grid'5000 community a simple but efficient mecanism to
plug different deployment scenarios. Two scenarios are shipped with the repo :

* Starter Kit (all in one deployment)
* Multinode

Users can then add their own scenarios to fit their needs (extra services to add,
different topology, custom configuration, ...)

## ... and beyond

The deployment process is divided in two parts :

* the generic part during which a puppet cluster is deployed.
* the specific part during which the specific scenario is deployed. It executes
the tasks ```scenario:main``` where all the specific code resides.
For instance in the multinode setup it appends some key/values to the hiera database,
 runs the puppet agent on the different nodes and bootstraps the installation
(add cirros images, create networks, modify default security-group ...)

Recently I had to deploy Mesos (more precisely to update an old deployment script)
on Grid'5000. Since I wrote some puppet code to manage the deployment, I realized
that I could plug this in ```xp5k-openstack```. This releaved me from writing all
the code that handle the job reservation/deployment and the puppet cluster preparation.

The ```mesos``` scenario is available : [https://github.com/msimonin/xp5k-mesos](https://github.com/msimonin/xp5k-mesos)

More generally ```xp5k-openstack``` should be able to manage all deployments
 that require puppet. Maybe we should remove ```openstack``` in the name ?
