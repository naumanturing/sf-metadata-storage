/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 12-18-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class FavoriteItemsController {
    
    // Fetches products with pagination and the total count of products.
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProductsWithTotalCount(Integer pageNumber, Integer pageSize) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            // Calculate the offset based on the current page number and page size
            Integer offset = (pageNumber - 1) * pageSize;
            
            // Query products for the current page
            List<Product__c> products = [SELECT Id, ProductName__c, Price__c, ImageURL__c, Description__c, Type__c
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
}