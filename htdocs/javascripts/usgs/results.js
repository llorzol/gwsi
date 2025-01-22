/**
 * Namespace: Main
 *
 * Main is a JavaScript library to provide a set of functions to manage
 *  the web requests.
 *
 * version 1.37
 * January 22, 2025
*/

/*
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
*/

// Prevent jumping to top of page when clicking a href
//
jQuery('.noJump a').click(function(event){
   event.preventDefault();
});

// Global objects
//
let myData      = null;   
let nwis_text   = null;
let nwis_column = null;
let nwis_output = null;

// loglevel
//
let myLogger = log.getLogger('myLogger');
//myLogger.setLevel('debug');
myLogger.setLevel('info');

// Prepare when the DOM is ready 
//
$(document).ready(function() {

    // Reset selected option
    //-------------------------------------------------
    $("#nwis_text").val('');
    $("#nwis_column").val('choose');
    $("#nwis_output").val('choose');
        
    jQuery("div#nwisQuery").show();
    jQuery("div#nwisResults").hide();

    // Submit request
    //
    jQuery('button#submitRequest').click(function(event) {
        myLogger.info('Clicked submit')
        
        submitRequest();
    });

    // Clear results
    //
    jQuery('button#clearResults').click(function(event) {
        myLogger.info('Clicked clearResults')
        
        clearResults();
    });

    // Clear form
    //
    jQuery('button#clearForm').click(function(event) {
        myLogger.info('Clicked clearForm')
        
        clearForm();
    });

    // Current url
    //-------------------------------------------------
    let url = new URL(window.location.href);
    myLogger.info(`Current Url ${window.location.href}`);
    myLogger.info(`Current Params ${url.searchParams}`);
    myLogger.info(`Current Params ${url.searchParams.has("nwis_text")}`);
    
    // Url contains all arguments
    //-------------------------------------------------
    if(url.searchParams.has("nwis_text") &&
       url.searchParams.has("nwis_column") &&
       url.searchParams.has("nwis_output")) {

        // Loading message
        //
        message = `Submitting request for site ${nwis_text}`;
        openModal(message);
        fadeModal(2000);

        // Set selected option
        //-------------------------------------------------
        $("#nwis_text").val(url.searchParams.get("nwis_text"));
        nwis_text = $('#nwis_text').val().trim();
        $("#nwis_column").val(url.searchParams.get("nwis_column"));
        nwis_column = $('#nwis_column').val();
        $("#nwis_output").val(url.searchParams.get("nwis_output"));
        nwis_output = $('#nwis_output').val();            

        myLogger.info(`Submitting url ${url}`);
        myLogger.info(`Setting nwis_text ${nwis_text} nwis_column ${nwis_column} nwis_output ${nwis_output}`);

        // Submit request
        //
        if(checkRequest(url.toString())) {
            nwisRequest(nwis_text, nwis_column, nwis_output)
        }
    }
    
    // Url contains nwis_text and nwis_column
    //-------------------------------------------------
    else if(url.searchParams.has("nwis_text") ||
       url.searchParams.has("nwis_column") ||
       url.searchParams.has("nwis_output")) {

        // Loading message
        //
        message = `Loading form for a request`;
        openModal(message);
        fadeModal(2000);

        myLogger.info(`Submitting url ${url}`);

        // Set selected option
        //-------------------------------------------------
        if(url.searchParams.has("nwis_text")) {
            $("#nwis_text").val(url.searchParams.get("nwis_text"));
            nwis_text = $('#nwis_text').val().trim();            
        }
        if(url.searchParams.has("nwis_column")) {
            $("#nwis_column").val(url.searchParams.get("nwis_column"));
            nwis_column = $('#nwis_column').val();            
        }
        if(url.searchParams.has("nwis_output")) {
            $("#nwis_output").val(url.searchParams.get("nwis_output"));
            nwis_output = $('#nwis_output').val();            
        }
        myLogger.info(`Setting nwis_text ${nwis_text} nwis_column ${nwis_column} nwis_output ${nwis_output}`);
    }

    // Show form
    //
    else {
        // Loading message
        //
        message = "Preparing form for a request";
        openModal(message);
        fadeModal(2000);
    }
});

// ==================================================
// Functions
// ==================================================

// Submit request
//
function submitRequest() {

    nwis_text   = $('#nwis_text').val().trim();
    nwis_column = $('#nwis_column').val();
    nwis_output = $('#nwis_output').val();
    myLogger.info(`Processing NWIS nwis_text ${nwis_text} nwis_column ${nwis_column} nwis_output ${nwis_output}`);

    let url = new URL(window.location.href);
    url.searchParams.set("nwis_text", nwis_text);
    url.searchParams.set("nwis_column", nwis_column);
    url.searchParams.set("nwis_output", nwis_output);
    myLogger.info(`Url ${url} -> nwis_text ${nwis_text} nwis_column ${nwis_column} nwis_output ${nwis_output}`);

    window.history.pushState(null, '', url.toString());
    myLogger.info("Modified Url " + window.location.href);

    if(checkRequest(url.toString())) {
        nwisRequest(nwis_text, nwis_column, nwis_output)
    }
}

// Reset Url and form
//
function clearResults() {

    jQuery("div#nwisQuery").show();
    jQuery("div#nwisResults").hide();
    $("div#nwisResults").html('');
}

// Reset Url and form
//
function clearForm() {
    $("#nwis_text").val('');
    $("#nwis_column").val('choose');
    $("#nwis_output").val('choose');

    jQuery("div#nwisQuery").show();
    jQuery("div#nwisResults").hide();
    $("div#nwisResults").html('');

    let url = new URL(window.location.href);
    myLogger.info("Current Url " + url);
    url.searchParams.delete('nwis_text');
    myLogger.info("Current Url " + url);
    url.searchParams.delete('nwis_column');
    myLogger.info("Current Url " + url);
    url.searchParams.delete('nwis_output');
    myLogger.info("Current Url " + url);
    window.history.pushState(null, '', url.toString());
}

// Check arguments
//
function checkRequest() {
    myLogger.info(`checkRequest`);
    //closeModal();

    let url = new URL(window.location.href);
    myLogger.info(`Current Url ${url}`);

    // Parse
    //-------------------------------------------------
    if(url.searchParams.get("nwis_text")) {
        nwis_text = url.searchParams.get("nwis_text");
        myLogger.info(`Parse nwis_text ${nwis_text}`);

        nwis_text = checkSiteId(nwis_text);
        myLogger.info(`Check nwis_text ${nwis_text}`);

        if(!nwis_text) {
            myLogger.error(`Error ${messageSiteId}`);
            closeModal();
            openModal(messageSiteId);
            fadeModal(6000);

            return false;
        }
    }
    else {
        myLogger.error(`Error ${messageSiteId}`);
        openModal(messageSiteId);
        fadeModal(6000);

        return false;
    }
       
    if(url.searchParams.get("nwis_column")) {
        nwis_column = url.searchParams.get("nwis_column");
        myLogger.info(`Parse nwis_column ${nwis_column}`);

        const nwisCols = ["site_no", "coop_site_no", "station_nm", "otid"];
        
        if(!nwisCols.includes(nwis_column.toLowerCase())) {
            message = 'Choose one: site number, cooperator site number, station name, or other id';
            openModal(message);
            fadeModal(6000);

            return false;
        }
    }
        
    if(url.searchParams.get("nwis_output")) {
        nwis_output = url.searchParams.get("nwis_output");
        myLogger.info(`Parse nwis_output ${nwis_output}`);

        const nwisOuts = ["sitefile", "general", "construction", "geohydrology", "all"];

        if(!nwisOuts.includes(nwis_output.toLowerCase())) {
            message = 'Choose one: NWIS file options ';
            openModal(message);
            fadeModal(6000);

            return false;
        }
    }

    myLogger.info(`Processing NWIS nwis_text ${nwis_text} nwis_column ${nwis_column} nwis_output ${nwis_output}`);

    // Check arguments need nwis_text and nwis_output
    //
    if(nwis_column && (!nwis_text || !nwis_output)) {

        message = "Enter NWIS Identifier and NWIS files(s)";
        openModal(message);
        fadeModal(2000);

        return false;         
     }

    // Check arguments need nwis_text and nwis_column
    //
    if(nwis_output && (!nwis_text || !nwis_column)) {

        message = "Enter NWIS Identifier and search field";
        openModal(message);
        fadeModal(2000);

        return false;         
    }

    return true;
}

// Retrieve information
//
function nwisRequest(nwis_text, nwis_column, nwis_output) {

    // Build ajax requests
    //
    let webRequests  = [];

    // Request for site information
    //
    let request_type = "GET";
    let script_http  = '/cgi-bin/gwsi/requestNwisFiles.py?';
    let data_http    = nwis_column + '=' + encodeURIComponent(nwis_text) + '&component=' + nwis_output;
    let dataType     = "text";

    // Web request
    //
    webRequests.push($.ajax( {
        method:   request_type,
        url:      script_http,
        data:     data_http,
        dataType: dataType,
        success: function (myData) {
            message = "Processed NWIS information";
            openModal(message);
            fadeModal(2000);
            myFiles = JSON.parse(myData);
        },
        error: function (error) {
            message = `Failed to load NWIS information ${error}`;
            openModal(message);
            fadeModal(2000);
            return false;
        }
    }));

   // Run ajax requests
   //
    $.when.apply($, webRequests).then(function() {

        fadeModal(2000);
        myLogger.info('NWIS output')
        myLogger.info(myFiles)

        if(myFiles) {
            jQuery("div#nwisQuery").hide();
            jQuery("div.nwisResults").show();

            let filesL = Object.keys(myFiles);

            for(let i = 0; i < filesL.length; i++) {
                let myTable = filesL[i];
                myLogger.info(`Table ${myTable}`)
                let myRecords = myFiles[filesL[i]];
                myLogger.info('myRecords')
                myLogger.info(myRecords)

                // Special case more than one sitefile records
                //
                if(myTable === 'sitefile' && myRecords.length > 1) {
                    for(let i = 0; i < myRecords.length; i++) {
                        myRecords[i]['site_no'] = `<span id="site_${myRecords[i]['site_no']}" class="sitefile">${myRecords[i]['site_no']}</span>`;
                    }
                }

                jQuery("div#nwisResults").append(`<div id="${myTable}Caption" class="fs-4 fw-bold text-center border-bottom border-2 border-black mt-3 ps-1 py-1">NWIS Table: ${myTable}</div>`);
                
                // Build table with records
                //
                if(myRecords.length > 0) {

                    jQuery("div#nwisResults").append(`<div id="${myTable}Table" class="table-responsive fs-6 fw-bold text-center ps-1 py-1"></div>`);
                    jQuery(`div#${myTable}Table`).html(`<table id="${myTable}" class="table table-sm table-bordered table-hover table-striped-columns align-middle overflow-scroll"></table>`);

                    let rowData   = myRecords[0];
                    let columns   = []
                    Object.keys( rowData ).forEach( function (key, index) {
                        columns.push( {data: key, title: key} );
                    });
                    let tblReport = new DataTable(`table#${myTable}`, {
                        order: [[1, 'asc']],
                        layout: {
                            topStart: {
                                buttons: [ 'csv',
                                           {
                                               extend: 'print',
                                               messageTop: `U.S. Geological Survey Information for NWIS Table: ${myTable}`,
                                               autoPrint: false,
                                               customize: function (doc) {
                                                   $(doc.document.body).find('h1').css('font-size', '11pt');
                                                   $(doc.document.body).find('h1').css('text-align', 'center');
                                                   $(doc.document.body).find('h1').css('font-weight:', 'bold');
                                                   $(doc.document.body).find('div').css('font-size', '10pt');
                                                   $(doc.document.body).find('div').css('text-align', 'center');
                                                   $(doc.document.body).find('div').css('font-weight:', 'bold');
                                                   $(doc.document.body).find('thead').css('font-size', '9pt');
                                                   $(doc.document.body).find('tbody').css('font-size', '8pt');
                                               }
                                           },
                                           {
                                              extend: 'excel',
                                              sheetName: `Table ${myTable}`,
                                              title: '',
                                              messageTop: `U.S. Geological Survey Information for NWIS Table: ${myTable}`,
                                              customize: function ( xlsx ) {
                                                  var sheet = xlsx.xl.worksheets['sheet1.xml'];
                                                  $('row:first c', sheet).attr( 's', '17' );
                                              }
                                          },
                                          'pdf']
                            }
                        },
                        data : myRecords,
                        columns : columns
                    })
                    //tblReport.caption(`NWIS Table: ${myTable}`, 'top');
                    //caption: `<caption id="${myTable}Caption" class="caption-top fs-4 fw-bold text-center mt-3 ps-1 py-1">NWIS Table: ${myTable}</caption>`,

                    jQuery(`table#${myTable}`).addClass('text-black border border-black border-2 rounded');
                    jQuery(`table#${myTable} thead tr`).addClass('bg-success');
                    jQuery(`.sitefile`).click(function(event) {
                        let site_no = this.id.replace('site_', '');
                        myLogger.info(`Clicked site ${site_no}`)
                        let url = new URL(window.location.href);
                        url.searchParams.set("nwis_text", site_no);
                        url.searchParams.set("nwis_column", 'site_no');
                        url.searchParams.set("nwis_output", 'all');

                        window.open(url, '_blank')
                    });
                    myLogger.info(`Site rows ${jQuery('.sitefile').length}`);
                }

                // No records message
                //
                else {
                    jQuery("div#nwisResults").append(`<div id="${myTable}Table" class="fs-5 fw-bold text-danger text-center ps-1 py-1">No Records</div>`);
                }
            }

            jQuery("div#nwisResults").show();
            
        }
    });

}

function DataTables (tableSelector, myTitle, fileName)
  {

     // TableSorter - New Version with Fixed Headers
     //-------------------------------------------------
     let table = jQuery(tableSelector).DataTable( {
         rowGroup: {dataSrc: 1 },
         "paging":    false,
         scrollCollapse: true,
         scrollY: '40vh',
         "ordering":  true,
         //"info":      false,
         //"searching": false,
         "autoWidth": true,
         "stripeClasses": [],
         "bAutoWidth": false,
         "columnDefs": [
            {
                "targets": [ 6 ],
                "visible": false,
                "searchable": false
            }],
         "order": [[2, 'asc' ]],
         dom: 'Bfrtip',
         buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                sheetName: "KlamathWells",
                messageTop: myTitle,
                title: '',
                exportOptions: {
                    columns: [0, 2, 3, 4, 5, 6, 7],
                    rows: ':visible'
                },
                    customize: function ( xlsx ) {
                        var sheet = xlsx.xl.worksheets['sheet1.xml'];
                        $('row:first c', sheet).attr( 's', '17' );
                        
                        // Get unique values from rowGroup.dataSrc column
                        //
                        var groupNames = [... new Set( table.column(0).data().toArray() )];
                        //console.log('Groups:', groupNames);
        
                        // Loop over all cells in sheet
                        //
                        //$('row a', sheet).each( function () {
                        var skippedHeader = false;
                        $('row c', sheet).each( function () {
                            //console.log(" Row " + $(this).text());
                            
                            if (skippedHeader) {
                                
                                // If active
                                //
                                if ( $('is t', this).text().indexOf("Active") > -1 ) {
                                   $(this).attr('s', '37');
                               }
        
                               else if ( $('is t', this).text().indexOf("Inactive") > -1 ) {
                                   $(this).attr('s', '2');
                               }
                            }
                            else {
                                skippedHeader = true;
                            }
                        });
                    }
            },
            {
                extend: 'print',
                messageTop: myTitle,
                autoPrint: false,
                exportOptions: {
                    columns: [0, 2, 3, 4, 5, 6, 7],
                    rows: ':visible'
                },
                customize: function (doc) {
                    $(doc.document.body).find('h1').css('font-size', '16pt');
                    $(doc.document.body).find('h1').css('text-align', 'center');
                    $(doc.document.body).find('h1').css('font-weight:', 'bold');
                    $(doc.document.body).find('div').css('font-size', '14pt');
                    $(doc.document.body).find('div').css('text-align', 'center');
                    $(doc.document.body).find('div').css('font-weight:', 'bold');
                    $(doc.document.body).find('thead').css('font-size', '12pt');
                    $(doc.document.body).find('tbody').css('font-size', '10pt');
                }
            },
            {
                extend: 'pdfHtml5',
                messageTop: myTitle,
                autoPrint: false,
                exportOptions: {
                    columns: [0, 2, 3, 4, 5, 6, 7],
                    rows: ':visible'
                },
                customize: function (doc) {
                    doc.defaultStyle.fontSize = 8;
                    doc.styles.tableHeader.fontSize = 8;
                }
            },
            {
                text: 'Geojson',
                autoPrint: true,
                action: function ( e, dt, node, config ) {
                    message = 'Exporting sites in geojson format';
                    openModal(message);
                    fadeModal(3000);
                    var file = 'KlamathSites.geojson';
                      saveAs(new File([JSON.stringify(geojsonSites)], file, {
                        type: "text/plain;charset=utf-8"
                      }), file);
                }
            }
        ]
     });
  }
