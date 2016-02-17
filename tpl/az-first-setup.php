<?php
	//TODO
?>
<div class="row">
	<div class="col-md-12">
		<p id="separator"><strong>Please provide below the AMAZON Marketplace Web Service's API configuration keys.</strong> <span class="glyphicon glyphicon-question-sign" style="color: #00ADED;"></span> <a href="#" data-toggle="modal" data-target="#infoModal">What's that?</a></p>
		<div class="col-md-6 az-logo">
			<img class="img-responsive" src=<?php echo plugins_url("assets/img/az-logo-lg.png",dirname(__FILE__)); ?>>
		</div>
		<div class="col-md-6 col-md-4 col-md-offset-1">
			<form class="form-horizontal" data-toggle="validator" role="form" id="AZMWS" method="POST" action="#">
				<div class="form-group">
					<label for="MerchantID">Merchant ID:</label>
					<input type="text" class="form-control" id="MerchantID" name="MerchantID" required>
				</div>
				<div class="form-group">
					<label for="MerchantID">MarketPlace ID:</label>
					<input type="text" class="form-control" id="MarketPlaceID" name="MarketPlaceID" required>
				</div>
				<div class="form-group">
					<label for="MerchantID">AWS Access Key ID:</label>
					<input type="text" class="form-control" id="AWSAccessKeyID" name="AWSAccessKeyID" required>
				</div>
				<div class="form-group">
					<label for="MerchantID">Secret Key:</label>
					<input type="text" class="form-control" id="SecretKey" name="SecretKey" required>
				</div>
				<div class="form-group">
					<label for="region">Select Region:</label>
					<select class="form-control" id="region">
					    <option value="US">North America</option>
					    <option value="EU">Europe</option>
					    <option value="JP">Japan</option>
					    <option value="CN">China</option>
					</select>
				</div>
				<div class="form-group">
					<button type="submit" id="api-keys-btn" class="btn btn-primary pull-right"><span class="loading-img"></span> Submit</button>
				</div>
			</form>
		</div>
	</div>
</div>

<!-- TEST RESULT -->
<div class="row">
	<div class="col-md-12">
		<p id="notice-me-senpai"></p>
	</div>
</div>

<!-- MODAL -->
<div id="infoModal" class="modal fade" role="dialog">
	<div class="modal-dialog modal-lg">
		<!-- Modal content-->
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal">&times;</button>
				<h4 class="modal-title">Amazon MWS Info</h4>
			</div>
			<div class="modal-body">
				<!-- MODAL BODY -->
				<p>To get your Amazon MWS details you must sign up to MWS. To register for Amazon MWS, sign up using the appropriate link below:</p>
				<p>
					UK: <a href="http://developer.amazonservices.co.uk" target="_blank">http://developer.amazonservices.co.uk</a><br>
					DE: <a href="http://developer.amazonservices.de" target="_blank">http://developer.amazonservices.de</a><br>
					FR: <a href="http://developer.amazonservices.fr" target="_blank">http://developer.amazonservices.fr</a><br>
					JP:&nbsp; <a href="http://developer.amazonservices.jp" target="_blank">http://developer.amazonservices.jp</a><br>
					US: <a href="http://developer.amazonservices.com" target="_blank">http://developer.amazonservices.com</a><br>
					CA: <a href="http://developer.amazonservices.ca" target="_blank">http://developer.amazonservices.ca</a>
				</p>
				<p>Click <strong>Sign up for MWS.<br></strong>Log into your Amazon account.<br>Select <strong>I want to access my own Amazon seller account with MWS </strong>as shown by the first option in the image below.  </p>
				<p>
					<img src="http://support.sellerexpress.com/hc/en-us/article_attachments/200297798/mwsscreen1.JPG" title="Image: /hc/en-us/article_attachments/200297798/mwsscreen1.JPG"><br><br>
					Click <strong>Next.<br></strong>
					Accept the MWS License Agreement.<br>
					Click <strong>Submit.<br></strong>
					Your Access Key ID, Secret Key ID, Merchant ID and Marketplace ID are displayed, example below.
				</p>
				<p><img src="http://support.sellerexpress.com/hc/en-us/article_attachments/200345037/mwsscreen2.jpg"><br></p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
			</div>
		</div>
		<!-- End Modal content -->
	</div>
</div>