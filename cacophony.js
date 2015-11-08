Products = new Meteor.Collection('products');

if (Meteor.isClient) {

  Template.primaryActions.helpers({});

  Template.addProduct.helpers({
    productAdd: function () {
      if (Session.get('isProductAdd')) {
        return Session.get('isProductAdd');
      } else {
        return '';
      }
    },
    productSearch: function () {
      if (Session.get('searchObject')) {
        console.log(Session.get('searchObject'));
        var searchObject = Session.get('searchObject');
        return searchObject.ItemLookupResponse.Items[0].Item[0].LargeImage[0].URL[0];
      } else {
        return 'Waiting...';
      }
    }
  });

  Template.primaryActions.events({
    'click .add': function () {
      Session.set('isProductAdd', 'show');
    }
  });

  Template.addProduct.events({
    'submit form': function (event) {
      event.preventDefault();
      var theISBN = event.target.productLookup.value;
      Meteor.call("isbnAWS", theISBN, function (error, result) {
        if (error) {
          Session.set('searchObject', error.reason);
        } else {
          Session.set('searchObject', result);
        }
      });
    }
  });

  Template.barcode_scanner.events({
    'click button': function () {
      //var Quagga = Meteor.npmRequire('quagga');
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream"
        },
        decoder: {
          readers: ["code_128_reader"]
        }
      }, function (err) {
        if (err) {
          console.log(err);
          return
        }
        console.log("Initialization finished. Ready to start");
        Quagga.start();
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {

    Meteor.methods({

      // ISBN Lookup for AWS
      isbnAWS: function(isbn) {

        OperationHelper = apac.OperationHelper;

        isbn = isbn.replace(/-/g,"");
        console.log("Looking up ISBN: " + isbn);
        product = Products.findOne({"isbn": isbn});

        // If the book isn't in cache, use apac to get information into cache.
        if (!product) {

          // Instantiate the OH object for APAC.
          OpHelper = new OperationHelper({
            awsId:     'AKIAJRW25LR2ZYTCMNLQ',
            awsSecret: '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',
            assocId:   'cacoclub-20'
          });

          // Use OH to query AWS, synchronously.
          result = OpHelper.executeSync('ItemLookup', {
            SearchIndex: 'Books',
            ResponseGroup: 'Medium,Images',
            IdType: 'ISBN',
            ItemId: isbn
          });
          return result;
        } else {
          console.log("Using cache for ISBN: " + isbn);
        }

      }

    });

  });
}
