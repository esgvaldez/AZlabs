
<div id="floatingMenu">
    <div class="fm-div">
        <fieldset>
            <legend><strong><span class="glyphicon glyphicon-user" style="color:#337AB7;"></span> Current Client </strong> <span id="fm-refresh" class="glyphicon glyphicon-refresh pull-right" style="color:#337AB7; cursor:pointer;" title="Recent client didn't show up? Refresh!" data-toggle="tooltip"></span></legend>
            <table id="fm-table">
                <tbody>
                    <tr>
                        <td id="fm-dualPurposeContainer">
                            <div id="fm-searchFieldContainer" class="onEditor-hide">
                                <input class="typeahead" type="text" placeholder="Search client...">
                            </div>
                            <strong id="fm-currentClient">NONE</strong>
                        </td>
                        <td id="fm-clientAction">
                            <button class="btn btn-primary" id="fm-searchToggle"><span class="glyphicon glyphicon-search"></span></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </fieldset>
    </div>
</div>

<ul class="nav nav-pills" id="azTab">
    <li class="active"><a data-toggle="pill" href="#content-A"><span class="glyphicon glyphicon-arrow-down"></span> <b>Create Inbound Shipment Listing</b></a></li>
    <li><a data-toggle="pill" href="#content-B"><span class="glyphicon glyphicon-list"></span> <b>Inventory List</b></a></li>
    <li><a data-toggle="pill" href="#content-C"><span class="glyphicon glyphicon-list-alt"></span> <b>Shipping Queue</b></a></li>
    <li><a data-toggle="pill" href="#tab-settings"><span class="glyphicon glyphicon-wrench"></span> <b>Settings</b></a></li>
    <img class="img-responsive pull-right" src=<?php echo plugins_url("assets/img/az-logo-lg.png", dirname(__FILE__)); ?> style="display: block; max-width:230px; max-height:42px; width: auto; height: auto; padding-right: 100px;">
</ul>

<div class="tab-content">
    <div class="loading">Loading&#8230;</div>

    <div id="content-A" class="tab-pane fade in active col-md-12">
        <p id="separator"></p>
        <div class="row">
            <div class="col-md-8" id="addressList-dropdown"></div>
            <div class="col-md-4 search-asin-form hidden">
                <div id="search-asin">
                    <div class="col-xs-6">
                        <input id="item-lookup" type="text" class="form-control" placeholder="Enter item ID">
                    </div>
                    <button type="submit" class="btn btn-primary item-search-btn"><span class="loading-img"></span> Search </button>
                </div>
            </div>
        </div>
        <p id="separator"></p>
        <div class="row">
            <div class="col-md-5">
                <div id="search-result">
                    <!-- Results display -->
                    <div class="searched-data hidden">
                        <img src="" alt="Item Image not available">
                        <p id="search-item">
                        <h4><a href="" target="_blank" id="searched-itemname">ITEM NAME</a></h4>
                        </p>
                        <p id="searched-itemauthor">N/A</p>
                        <p id="searched-itemmanufacturer"> N/A | N/A </p>
                        <p>
                            <a href="#" id="addToPlan" class="btn btn-primary">Add item to Inbound Shipment Plan</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-md-7">
                <div class="scrollable">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>MSKU</th>
                                <th>Quantity</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inbound-prep"></tbody>
                    </table>
                </div>
            </div>
            <div class="col-md-12">
                <p id="separator"></p>
                <button id="save-inbound" class="btn btn-success pull-right disabled"><span class="glyphicon glyphicon-save"></span> SAVE INBOUND SHIPMENT PLAN</button>
            </div>
        </div>
    </div>

    <div id="content-B" class="tab-pane fade">
        <div class="row">
            <div class="col-md-12">
                <p><strong>Coming Soon...</strong></p>
                <p id='notice-me-senpai'></p>
            </div>
        </div>
    </div>

    <!-- INBOUND SHIPMENTS -->
    <div id="content-C" class="tab-pane fade">
        <div class="row" style="position: relative;">
            <div class="col-md-12">
                <div style="padding: 10px;">
                    <button class="refreshShipmentList btn btn-primary" name="refresh">
                        <span class="glyphicon glyphicon-refresh"></span> Refresh
                    </button>
                    <button class="syncShipmentList btn btn-primary" name="sync">Sync an Inbound Shipment from SellerCentral</button>
                </div>
                <p id="separator"></p>
                <div class="col-md-6">
                    <div class="plans scrollable"></div>
                </div>
                <div class="col-md-6">
                    <div class="shipment-review scrollable"></div>
                </div>
            </div>
        </div>
        <p id="separator"></p>
        <div class="row">
            <div class="col-md-6">
                <!-- TODO -->
            </div>
        </div>
    </div>

    <div id="tab-settings" class="tab-pane fade">
        <div class="row" style="position: relative;">
            <div class="col-md-12">
                <div class="col-md-3">
                    <div class="box">
                        <fieldset>
                            <legend>Contact Settings</legend>
                            <button class="btn btn-primary settingOpt" name="registerNewContact">Add new Contact</button>
                            <button class="btn btn-primary settingOpt" name="registerNewAddress">Add new 'Ship From' Address</button>
                            <button class="btn btn-primary settingOpt" name="manageContacts">Manage Contact</button>
                        </fieldset>
                    </div>
                    <div class="box">
                        <fieldset>
                            <legend>Selltec client mgmt.</legend>
                            <button class="btn btn-primary settingOpt" name="registerNewClientKey">Add new client</button>
                            <button class="btn btn-primary settingOpt" name="getClientKey">View Clients</button>
                        </fieldset>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="settingsContainer"></div>
                </div>
            </div>
        </div>	
    </div>