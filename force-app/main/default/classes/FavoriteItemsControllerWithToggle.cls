/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 12-18-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class FavoriteItemsControllerWithToggle {
    
    // Fetches products with pagination and the total count of products.
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProductsWithTotalCount(Integer pageNumber, Integer pageSize) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            // Calculate the offset based on the current page number and page size
            Integer offset = (pageNumber - 1) * pageSize;
            
            // Query products for the current page
            List<Product__c> products = [SELECT Id, ProductName__c, Price__c, ImageURL__c, Description__c, Type__c, Is_Favorite__c
                                         FROM Product__c
                                         WHERE ImageURL__c != NULL
                                         WITH SECURITY_ENFORCED
                                         ORDER BY Name
                                         LIMIT :pageSize OFFSET :offset];
            
            // Get total product count
            Integer totalProducts = [SELECT COUNT() FROM Product__c WITH SECURITY_ENFORCED];
            
            // Put the results into the map
            result.put('products', products);
            result.put('totalProducts', totalProducts);
        } catch (Exception e) {
            // Handle any errors that may occur during the process
            System.debug('Error fetching products: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching products. Please try again later.');
        }
        
        // Return the map with products and total count
        return result;
    }

    // Apex method to update the favorite status of a product
    @AuraEnabled
    public static void updateFavoriteStatus(Id productId, Boolean isFavorite) {
        try {
            // Query the Product__c record based on the provided productId
            // The WITH SECURITY_ENFORCED clause ensures proper security checks are enforced on the record
            Product__c product = [SELECT Id, Is_Favorite__c FROM Product__c WHERE Id = :productId WITH SECURITY_ENFORCED LIMIT 1];
            
            // Update the Is_Favorite__c field with the provided value
            product.Is_Favorite__c = isFavorite;
            
            // Save the updated product record to the database
            update as user product;
        } catch (Exception e) {
            // Catch any exceptions and throw a custom error message
            throw new AuraHandledException('Error updating favorite status.');
        }
    }

}