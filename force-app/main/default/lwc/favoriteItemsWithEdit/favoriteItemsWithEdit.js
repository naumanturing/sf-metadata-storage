import { LightningElement, wire, track } from 'lwc';
import getProductsWithTotalCount from '@salesforce/apex/FavoriteItemsControllerWithEdit.getProductsWithTotalCount';
import updateFavoriteStatus from '@salesforce/apex/FavoriteItemsControllerWithEdit.updateFavoriteStatus';
import updateProductDetails from '@salesforce/apex/FavoriteItemsControllerWithEdit.updateProductDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class FavoriteItemsWithEdit extends LightningElement {
    @track products = [];
    @track currentPage = 1;
    @track totalProducts = 0;
    @track isLoading = false; // Spinner control
    pageSize = 6; // Products per page
    wiredResult;

    // Modal related state
    @track isModalOpen = false;
    @track currentProduct = {};

    // Returns the total number of pages based on the total products and page size.
    get totalPages() {
        return Math.ceil(this.totalProducts / this.pageSize);
    }

    // Checks if the "Previous" button should be disabled based on the current page.
    get isPreviousDisabled() {
        return this.currentPage === 1;
    }

    // Checks if the "Next" button should be disabled based on the current page.
    get isNextDisabled() {
        return this.currentPage === this.totalPages;
    }

    // Wired method to fetch products data from the Apex controller with pagination.
    @wire(getProductsWithTotalCount, { pageNumber: '$currentPage', pageSize: '$pageSize' })
    wiredProducts(result) {
        this.wiredResult = result;
        if (result.data) {
            // Add the 'favoriteIcon' field dynamically for each product
            this.products = result.data.products.map(product => ({
                ...product,
                isFavorite: product.Is_Favorite__c, // assuming 'Is_Favorite__c' is the field
                favoriteIcon: product.Is_Favorite__c ? 'utility:favorite' : 'utility:favorite_alt' // Set icon dynamically
            }));
            this.totalProducts = result.data.totalProducts;
            this.isLoading = false;
        } else if (result.error) {
            console.error(result.error);
            this.showToast('Error' , 'Error while fetching data' , 'error');
            this.isLoading = false;
        }
    }

    // Handles the "Next" button click to move to the next page.
    handleNextPage() {
        if (!this.isNextDisabled) {
            this.isLoading = true; // Show spinner
            this.currentPage++;
        }
    }

    // Handles the "Previous" button click to move to the previous page.
    handlePrevPage() {
        if (!this.isPreviousDisabled) {
            this.isLoading = true; // Show spinner
            this.currentPage--;
        }
    }

    // Handle opening the modal and populating the product data
    openModal(event) {
        const productId = event.target.dataset.id;
        const product = this.products.find(p => p.Id === productId);
        this.currentProduct = { ...product }; // Make a copy of the product data for editing
        this.isModalOpen = true; // Open the modal
    }

    // Handle closing the modal
    closeModal() {
        this.isModalOpen = false;
        this.currentProduct = {}; // Clear the current product data
    }

    handleInputChange(event) {
        const field = event.target.name;
        this.currentProduct[field] = event.target.value; // Update the corresponding field in currentProduct
    }

    // Handle product detail save
    saveProductDetails() {

        if (!this.currentProduct.ProductName__c || !this.currentProduct.Price__c || !this.currentProduct.Description__c) {
            this.showToast('Error', 'All fields must be filled in before saving.', 'error');
            return; // Stop execution if fields are empty
        }

        // Validate that Price__c is a valid number and greater than zero
        const price = parseFloat(this.currentProduct.Price__c);
        if (isNaN(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(this.currentProduct.Price__c)) {
            this.showToast('Error', 'Price must be a valid number greater than zero with up to two decimal places.', 'error');
            return; // Stop execution if price is invalid
        }
        
        updateProductDetails({
            productId: this.currentProduct.Id,
            productName: this.currentProduct.ProductName__c,
            price: this.currentProduct.Price__c,
            description: this.currentProduct.Description__c,
        })
        .then(() => {
            this.showToast('Success', 'Product details updated successfully', 'success');
            this.closeModal();
            refreshApex(this.wiredResult); // Refresh the product list
        })
        .catch(error => {
            this.showToast('Error', 'Error updating product details', 'error');
            console.error('Error:', error);
        });
    }


    // Toggle favorite status on product
    toggleFavorite(event) {
        const productId = event.target.dataset.id;
        const product = this.products.find(p => p.Id === productId);
        const newFavoriteStatus = !product.isFavorite;

        // Call Apex to update favorite status in Salesforce
        updateFavoriteStatus({ productId: productId, isFavorite: newFavoriteStatus })
            .then(() => {
                console.log('Favorite status updated successfully');
                this.showToast('Success' , 'Favorite status updated successfully' , 'success');
                refreshApex(this.wiredResult);
            })
            .catch(error => {
                console.error('Error updating favorite status', error);
                this.showToast('Error' , 'Error updating favorite status' , 'error');
            });
    }

    // Method to display toast message to the user
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
}