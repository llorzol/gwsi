#!/usr/bin/env python
#
###############################################################################
# $Id: requestNwisFiles.py
#
# Project:  requestNwisFiles
# Purpose:  Script outputs site information from NWIS data records
#            in JSON format.
# 
# Author:   Leonard Orzol <llorzol@usgs.gov>
#
###############################################################################
# Copyright (c) Oregon Water Science Center
# 
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.
###############################################################################

import os, sys, string, re

import csv

import json

# Set up logging
#
import logging

# -- Set logging file
#
# Create screen handler
#
screen_logger = logging.getLogger()
formatter     = logging.Formatter(fmt='%(message)s')
console       = logging.StreamHandler()
console.setFormatter(formatter)
screen_logger.addHandler(console)
screen_logger.setLevel(logging.INFO)

# Import modules for CGI handling
#
from urllib.parse import quote_plus, parse_qs

# Parse the Query String
#
params = {}

site_nosL   = []

site_no = None
coop_site_no = None
otid = None
station_nm = None
component = None

HardWired = None
#HardWired = 1

if HardWired is not None:
    os.environ['QUERY_STRING'] = 'site_no=420358121280001'
    #os.environ['QUERY_STRING'] = 'site_no=414903121234001'
    #os.environ['QUERY_STRING'] = 'site_no=430508119582001'
    #os.environ['QUERY_STRING'] = 'site_no=434124119270901'
    #os.environ['QUERY_STRING'] = 'site_no=432822119011501'
    #os.environ['QUERY_STRING'] = 'site_no=431357118582301'
    #os.environ['QUERY_STRING'] = 'site_no=452335122564301'
    #os.environ['QUERY_STRING'] = 'site_no=453705119513901'
    #os.environ['QUERY_STRING'] = 'site_no=415947121243401'
    #os.environ['QUERY_STRING'] = 'site_no=422031121400001'
    os.environ['QUERY_STRING'] = 'otid=Well #4'
    os.environ['QUERY_STRING'] = 'otid=Well%20#4'
    
if 'QUERY_STRING' in os.environ:
    queryString = os.environ['QUERY_STRING']

    screen_logger.debug('queryString %s' % str(queryString))

    queryStringD = parse_qs(queryString, encoding='utf-8')

    screen_logger.debug('queryStringD %s' % str(queryStringD))

    myParmsL = [
        'site_no',
        'coop_site_no',
        'otid',
        'station_nm',
        'component'
    ]

    for key, values in queryStringD.items():
        if key in myParmsL:
            params[key] = values[0]

screen_logger.debug('params %s' % str(params))

if 'site_no' in params:
    site_no = params['site_no']
    site_nosL.append(site_no)
elif 'coop_site_no' in params:
    coop_site_no = params['coop_site_no']
elif 'otid' in params:
    otid = params['otid']
    screen_logger.info('otid %s' % str(otid))
elif 'station_nm' in params:
    station_nm = params['station_nm']
else:
    message = "Requires a NWIS site number or other Id or Station name or OWRD well log ID"
    print("Content-type:application/json\n\n")
    print('{ "message": "%s" }' % message)
    sys.exit()

component = 'all'
if 'component' in params:
    component = params['component']
    
# ------------------------------------------------------------
# -- Set
# ------------------------------------------------------------
debug           = False

program         = "USGS NWIS Files Script"
version         = "1.09"
version_date    = "January 22, 2025"

program_args    = []

# =============================================================================
def errorMessage(error_message):

    screen_logger.info(error_message)
    print("Content-type:application/json\n\n")
    print('{ "message": "%s" }' % error_message)
    sys.exit()

# =============================================================================
def jsonDefinitions (lookup_file):

    jsonD = {}

    # Create a CSV reader object and remove comment header lines
    #
    try:
        with open(lookup_file, "r") as fh:
            csv_reader = csv.DictReader(filter(lambda row: row[0]!='#', fh), delimiter='\t')

            # Loop through file
            #
            for tempD in csv_reader:

                # Check for sites with no valid location
                #
                column_nm    = tempD['column_nm']
                gw_ref_cd    = tempD['gw_ref_cd']
                gw_ref_nm    = tempD['gw_ref_nm']
                gw_ref_ds    = tempD['gw_ref_ds']
                parameter_nm = tempD['parameter_nm']
                gw_ed_tbl_nm = tempD['gw_ed_tbl_nm']

                if column_nm not in jsonD and len(gw_ref_cd) > 0:
                    jsonD[column_nm]                 = {}
                    jsonD[column_nm]['parameter_nm'] = parameter_nm
                    jsonD[column_nm]['gw_ref_nm']    = gw_ref_nm
                    jsonD[column_nm]['Codes']        = {}

                if len(gw_ref_cd) > 0:
                    jsonD[column_nm]['Codes'][gw_ref_cd] = gw_ref_ds
                
                    
    except FileNotFoundError:
        message = 'File %s not found' % lookup_file
        errorMessage(message)
    except PermissionError:
        message = 'No permission to access file %s' % lookup_file
        errorMessage(message)
    except Exception as e:
        message = 'An error occurred: %s' % e
        errorMessage(message)

    # Error
    #
    if len(jsonD) < 1:
        message = 'No NWIS definitions loaded from file %s' % lookup_file
        errorMessage(message)

    return jsonD

# =============================================================================
def nwisDefinitions (lookup_file, column_nm, gw_ref_ds, parameter_nm, gw_ref_nm):

    screen_logger.debug('%s' % ", ".join([column_nm, gw_ref_ds, parameter_nm, gw_ref_nm]))

    jsonD  = {}
    codesD = {}

    # Create a CSV reader object and remove comment header lines
    #
    try:
        with open(lookup_file, "r") as fh:
            csv_reader = csv.DictReader(filter(lambda row: row[0]!='#', fh), delimiter='\t')

            # Check for columns
            #
            csvRowD   = dict(list(csv_reader)[0])
            myColumns = list(csvRowD.keys())
            screen_logger.debug(myColumns)

            if column_nm not in myColumns:
                message = 'Column %s not found in file %s' % (column_nm, lookup_file)
                errorMessage(message)                
            if gw_ref_ds not in myColumns:
                message = 'Column %s not found in file %s' % (gw_ref_ds, lookup_file)
                errorMessage(message)

            # Loop through file
            #
            formatLine = None
            for tempD in csv_reader:
                screen_logger.debug('\nRecord')
                screen_logger.debug(tempD)

                # Skip format line
                #
                if formatLine is None:
                    formatLine = True
                    continue

                # Check for columns
                #
                gw_ref_cd = tempD[column_nm]
                gw_ref_ds = tempD[gw_ref_ds]
                screen_logger.debug('gw_ref_cd %s gw_ref_ds %s ' % (gw_ref_cd, gw_ref_ds))

                codesD[gw_ref_cd] = gw_ref_ds

        jsonD[column_nm]                 = {}
        jsonD[column_nm]['parameter_nm'] = parameter_nm
        jsonD[column_nm]['gw_ref_nm']    = gw_ref_nm
        jsonD[column_nm]['Codes']        = codesD                
                    
    except FileNotFoundError:
        message = 'File %s not found' % lookup_file
        errorMessage(message)
    except PermissionError:
        message = 'No permission to access file %s' % lookup_file
        errorMessage(message)
    except Exception as e:
        message = 'An error occurred: %s' % e
        errorMessage(message)
    except:
        message = 'An error occurred processing file %s' % lookup_file
        errorMessage(message)

    # Error
    #
    if len(jsonD) < 1:
        message = 'No NWIS definitions loaded from file %s' % lookup_file
        errorMessage(message)

    return jsonD

# =============================================================================

def processNwisFile (nwisFile, site_nosL):

    keyColumn = 'site_no'
    nwisInfoL   = []
    siteFlag    = False

    # Create a CSV reader object and remove comment header lines
    #
    try:
        with open(nwisFile, "r") as fh:
            csv_reader = csv.DictReader(filter(lambda row: row[0]!='#', fh), delimiter='\t')

            # Loop through file
            #
            for tempD in csv_reader:

                # Check for sites with no valid location
                #
                if tempD[keyColumn] in site_nosL:
                    # Set empty value to None
                    #
                    for key, value in tempD.items():
                        if len(value) < 1:
                            tempD[key] = None

                    nwisInfoL.append(tempD)

                else:
                    if siteFlag:
                        break
                    
    except FileNotFoundError:
        message = 'File %s not found' % nwisFile
        errorMessage(message)
    except PermissionError:
        message = 'No permission to access file %s' % nwisFile
        errorMessage(message)
    except Exception as e:
        message = 'An error occurred: %s' % e
        errorMessage(message)

    return nwisInfoL

# =============================================================================

def processFile (nwisFile, keyColumn, site_id):

    #screen_logger.info('keyColumn %s' % site_id)

    nwisInfoL   = []
    siteFlag    = False

    # Create a CSV reader object and remove comment header lines
    #
    try:
        with open(nwisFile, "r") as fh:
            csv_reader = csv.DictReader(filter(lambda row: row[0]!='#', fh), delimiter='\t')

            # Loop through file
            #
            for tempD in csv_reader:
                #screen_logger.info('keyColumn |%s|' % tempD[keyColumn])

                # Check for sites with no valid location
                #
                if tempD[keyColumn].upper() == site_id.upper():
                    #screen_logger.info('keyColumn %s' % tempD[keyColumn])
                    # Set empty value to None
                    #
                    for key, value in tempD.items():
                        if len(value) < 1:
                            tempD[key] = None

                    nwisInfoL.append(tempD)
                    
    except FileNotFoundError:
        message = 'File %s not found' % nwisFile
        errorMessage(message)
    except PermissionError:
        message = 'No permission to access file %s' % nwisFile
        errorMessage(message)
    except Exception as e:
        message = 'An error occurred: %s' % e
        errorMessage(message)

    return nwisInfoL

# =============================================================================

# ----------------------------------------------------------------------
# -- Main program
# ----------------------------------------------------------------------
lookup_file = "data/codes/nwis_codes.txt"
table_nmL   = [
    'sitefile',
    'gw_coop',
    'gw_netw',
    'gw_otdt',
    'gw_otid',
    'gw_cons',
    'gw_hole',
    'gw_csng',
    'gw_open',
    'gw_repr',
    'gw_geoh'
]
if component == 'sitefile':
    table_nmL = ['sitefile']
elif component == 'construction':
    table_nmL   = [
        'sitefile',
        'gw_cons',
        'gw_hole',
        'gw_csng',
        'gw_open',
        'gw_repr',
    ]
elif component == 'general':
    table_nmL   = [
        'sitefile',
        'gw_coop',
        'gw_netw',
        'gw_otid',
        'gw_otdt'
    ]
elif component == 'geohydrology':
    table_nmL = ['sitefile','gw_geoh']


# Read data dictionary
#
if os.path.exists(lookup_file):

    jsonD = jsonDefinitions(lookup_file)
    screen_logger.debug(jsonD)
    screen_logger.debug('')

else:
    message = "Can not open NWIS definitions file %s" % lookup_file
    errorMessage(message)

# Agency codes in separate file
#
nwis_file = os.path.join("data", "codes", 'agency_cd_query.txt')

if os.path.exists(nwis_file):
    codesD = nwisDefinitions (nwis_file, 'agency_cd', 'party_nm', 'Source agency code', ' ')
    if len(codesD) > 0:
        jsonD.update(codesD)

else:
    message = "Can not open NWIS agency codes definitions file %s" % nwis_file
    errorMessage(message)

# Aquifer codes in separate file
#
nwis_file = os.path.join("data", "codes", 'aqfr_cd_query.txt')

if os.path.exists(nwis_file):
    codesD = nwisDefinitions (nwis_file, 'aqfr_cd', 'aqfr_nm', 'Aqifer name', ' ')
    if len(codesD) > 0:
        jsonD.update(codesD)

else:
    message = "Can not open NWIS aquifer definitions file %s" % nwis_file
    errorMessage(message)

nwis_file = os.path.join("data", "codes", 'hucs_query.txt')

# HUC codes in separate file
#
if os.path.exists(nwis_file):
    codesD = nwisDefinitions (nwis_file, 'huc_cd', 'huc_nm', 'Basin name', ' ')
    if len(codesD) > 0:
        jsonD.update(codesD)

else:
    message = "Can not open NWIS HUC definitions file %s" % nwis_file
    errorMessage(message)
    errorMessage(message)

nwis_file = os.path.join("data", "codes", 'nat_aqfr_query.txt')

# National Aquifer codes in separate file
#
if os.path.exists(nwis_file):
    codesD = nwisDefinitions (nwis_file, 'nat_aqfr_cd', 'nat_aqfr_nm', 'National aquifer name', ' ')
    if len(codesD) > 0:
        jsonD.update(codesD)

else:
    message = "Can not open NWIS national aquifer definitions file %s" % nwis_file
    errorMessage(message)

    
# Find site_no with other ID
#
#screen_logger.info('otid %s' % otid)
if otid is not None:
    nwis_file = os.path.join("data", "files", "gw_otid_01.txt")
    if os.path.exists(nwis_file):
        # Open file
        #
        nwisInfoD = processFile(nwis_file, 'otid_id', otid)

        if len(nwisInfoD) < 1:
            table_nmL = ['sitefile']
            site_no = 'xxxxxx'
            #message = "No site connected to %s in NWIS table %s" % (otid, "gw_otid_01.txt")
            #errorMessage(message)
        elif len(nwisInfoD) < 2:
            if 'site_no' in nwisInfoD[0]['site_no']:
                site_no = nwisInfoD[0]['site_no']
        else:
            table_nmL = ['sitefile']
            for nwisRecord in nwisInfoD:
                site_nosL.append(nwisRecord['site_no'])
    
# Read and prepare output
#
nwisInfoD = {}

nwisL = []

for file in table_nmL:

    nwis_file = os.path.join("data", "files", "".join([file, "_01.txt"]))
    if os.path.exists(nwis_file):

        # Open file
        #
        nwisInfoD[file] = processNwisFile(nwis_file, site_nosL)

        recordL = []

        if len(nwisInfoD[file]) > 0:

            screen_logger.debug('\n\nNWIS File: %s' % file)

            for myRecord in nwisInfoD[file]:
                screen_logger.debug(myRecord)
                for myColumn in myRecord.keys():
                    screen_logger.debug('\nColumn %s: %s' % (myColumn, myRecord[myColumn]))
                    if myColumn in jsonD:
                        screen_logger.debug('jsonD Column %s: %s' % (myColumn, jsonD[myColumn]))
                        myCodes = jsonD[myColumn]['Codes'].keys()
                        screen_logger.debug('Codes: \n\t%s' % '\n\t'.join(myCodes))
                        if myRecord[myColumn] in myCodes:
                            myRecord[myColumn] += ' <--> %s' % jsonD[myColumn]['Codes'][myRecord[myColumn]]
                            screen_logger.debug('Final Column %s: %s' % (myColumn, myRecord[myColumn]))

                recordL.append(json.dumps(myRecord))
                
        nwisL.append('"%s": [%s] ' % (file, ",".join(recordL)))

    else:
        message = "NWIS file %s does not exist" % nwis_file
        errorMessage(message)

# Prepare json
# -------------------------------------------------
#
jsonL = []
jsonL.append("{")
#jsonL.append('"nwis":' + '{')
jsonL.append('%s' % ",".join(nwisL))
#jsonL.append("}")
jsonL.append("}")

# Output json
# -------------------------------------------------
#
print("Content-type:application/json\n\n")
print("".join(jsonL))

sys.exit()
