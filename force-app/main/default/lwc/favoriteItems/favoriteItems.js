import { LightningElement, wire, track } from 'lwc';
import getProductsWithTotalCount from '@salesforce/apex/FavoriteItemsController.getProductsWithTotalCount';

export default class FavoriteItems extends LightningElement {
    @track products = [];
    @track currentPage = 1;
    @track totalProducts = 0;
    @track isLoading = false; // Spinner control
    pageSize = 6; // Products per page

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
    wiredProducts({ data, error }) {
        if (data) {
            this.products = data.products;
            this.totalProducts = data.totalProducts;
            this.isLoading = false; // Stop loading
        } else if (error) {
            console.error(error);
            this.isLoading = false; // Stop loading
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
}