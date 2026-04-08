import { Select, Tooltip, Button } from 'antd';
import { LuChevronsUpDown } from 'react-icons/lu';
import { toast } from 'sonner';
import { CopyOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { searchVendorProducts, getVendorProductVariants, lookupVendorProductVariant } from '../../../apis/vendor';

const SubItemCost = ({ 
  data = {}, 
  fulfillName, 
  orderId, 
  orderItemId, 
  onProductChange,
  onSizeChange,
  onColorChange,
  onVariantDataChange,
  isLastItem = false,
  onApplyMapping = null,
  orderItems = [],
  isOrderApplied = false,
  isOrderEditing = false
}) => {
  const [vendorProducts, setVendorProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [variantData, setVariantData] = useState(null);
  const [loading, setLoading] = useState(false);
  console.log("orderItems: ", orderItems)
  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.log(err);
      toast.error('Failed to copy!');
    }
  };
  // Search vendor products
  const handleSearchVendorProducts = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      // Nếu có data sẵn, giữ lại trong options
      if (data?.vendorProductDisplayName) {
        setVendorProducts([{
          value: data.vendorProductId || data._id,
          label: data.vendorProductDisplayName,
          vendorId: data.vendorId
        }]);
      } else {
        setVendorProducts([]);
      }
      return;
    }
    
    try {
      setLoading(true);
      const response = await searchVendorProducts(searchTerm);
      const products = response.data.map(product => ({
        value: product._id,
        label: product.display_name,
        vendorId: product.vendor_id._id,
        ...product
      }));
      
      // Nếu có data sẵn và không có trong kết quả search, thêm vào đầu danh sách
      if (data?.vendorProductDisplayName) {
        const existingProduct = {
          value: data.vendorProductId || data._id,
          label: data.vendorProductDisplayName,
          vendorId: data.vendorId
        };
        
        const isExisting = products.some(p => p.value === existingProduct.value);
        if (!isExisting) {
          products.unshift(existingProduct);
        }
      }
      
      setVendorProducts(products);
    } catch (error) {
      console.error('Error searching vendor products:', error);
      toast.error('Failed to search vendor products');
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Get variants when product is selected
  const handleProductSelect = async (productId, option) => {
    try {
      setLoading(true);
      setSelectedProduct(option);
      setSizes([]);
      setColors([]);
      setSelectedSize(null);
      setSelectedColor(null);
      setVariantData(null);

      // Notify parent about product change
      if (onProductChange) {
        onProductChange(orderItemId, option, orderId);
      }

      const response = await getVendorProductVariants(productId);
      const { sizes: productSizes, colors: productColors } = response.data;
      
      // Check if sizes and colors exist and have values
      const hasSizes = productSizes && Array.isArray(productSizes) && productSizes.length > 0;
      const hasColors = productColors && Array.isArray(productColors) && productColors.length > 0;
      
      if (hasSizes) {
        setSizes(productSizes.map(size => ({ value: size, label: size })));
      }
      
      if (hasColors) {
        setColors(productColors.map(color => ({ value: color, label: color })));
      }
      
      // If product has no sizes AND no colors, lookup immediately with empty values
      if (!hasSizes && !hasColors) {
        handleVariantLookup('', '');
      }
      
    } catch (error) {
      console.error('Error getting variants:', error);
      toast.error('Failed to get product variants');
    } finally {
      setLoading(false);
    }
  };

  // Lookup variant details when size and color are selected
  const handleVariantLookup = async (size, color) => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const response = await lookupVendorProductVariant(
        selectedProduct.value, 
        color || '', // Use empty string if no color
        size || ''   // Use empty string if no size
      );
      setVariantData(response.data);
      
      // Notify parent about variant data change
      if (onVariantDataChange) {
        onVariantDataChange(orderItemId, {
          selectedProduct,
          selectedSize: size,
          selectedColor: color,
          variantData: response.data
        });
      }
    } catch (error) {
      console.error('Error looking up variant:', error);
      toast.error('Failed to lookup variant details');
      
      // Notify parent about error
      if (onVariantDataChange) {
        onVariantDataChange(orderItemId, null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    
    // Notify parent about size change
    if (onSizeChange) {
      onSizeChange(orderItemId, size);
    }
    
    // Always call lookup with current size and color (or empty string if not available)
    const currentColor = selectedColor || '';
    handleVariantLookup(size, currentColor);
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    
    // Notify parent about color change
    if (onColorChange) {
      onColorChange(orderItemId, color);
    }
    
    // Always call lookup with current size and color (or empty string if not available)
    const currentSize = selectedSize || '';
    handleVariantLookup(currentSize, color);
  };

  // Initialize with existing data
  useEffect(() => {
    if (data?.vendorProductDisplayName) {
      const existingProduct = {
        value: data.vendorProductId || data._id,
        label: data.vendorProductDisplayName,
        vendorId: data.vendorId
      };
      
      setSelectedProduct(existingProduct);
      setVendorProducts([existingProduct]);
      
      // If we have existing size and color, set them
      if (data.sizeValue) setSelectedSize(data.sizeValue);
      if (data.colorValue) setSelectedColor(data.colorValue);
    }
  }, [data]);

  return (
    <div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Vendor Product:</span>
        </div>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: 250 }}
          value={selectedProduct?.value}
          placeholder="Select Vendor Product"
          className="truncate"
          suffixIcon={<LuChevronsUpDown />}
          options={vendorProducts}
          onSearch={handleSearchVendorProducts}
          onSelect={handleProductSelect}
          // onFocus={() => {
          //   // Mark as editing when user focuses on dropdown
          //   if (onProductChange) {
          //     onProductChange(orderItemId, null, orderId);
          //   }
          // }}
          loading={loading}
          filterOption={false}
          notFoundContent={loading ? 'Searching...' : 'No products found'}
          dropdownStyle={{ minWidth: 500 }}
          optionLabelProp="label"
        />
      </div>
      
      <div className="mb-2">
        <div>
          <span className="font-medium">Size:</span>
        </div>
        <Select 
          style={{ width: 250 }} 
          value={selectedSize} 
          options={sizes} 
          placeholder={sizes.length > 0 ? "Select Size" : "No sizes available"} 
          suffixIcon={<LuChevronsUpDown />}
          onSelect={handleSizeSelect}
          disabled={!selectedProduct || sizes.length === 0}
        />
      </div>
      
      <div className="mb-2">
        <div>
          <span className="font-medium">Color:</span>
        </div>
        <Select 
          showSearch
          style={{ width: 250 }} 
          value={selectedColor} 
          options={colors} 
          placeholder={colors.length > 0 ? "Select Color" : "No colors available"} 
          suffixIcon={<LuChevronsUpDown />}
          onSelect={handleColorSelect}
          disabled={!selectedProduct || colors.length === 0}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="label"
        />
      </div>

      {variantData && !isOrderApplied && (
        <div className="mb-2 p-3 bg-gray-50 rounded">
          <div className="text-sm font-medium mb-2">Variant Details:</div>
          <div className="text-xs space-y-1">
            <div>SKU: {variantData.sku}</div>
            <div>Base Cost: ${variantData.base_cost}</div>
            <div>Standard Size: {variantData.standard_size}</div>
            <div>Standard Color: {variantData.standard_color}</div>
          </div>
        </div>
      )}

      <div className="mb-1 max-w-[250px]" style={{ position: 'relative', width: '100%' }}>
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div
          className="border px-2 py-1 rounded text-sm inline-flex items-center
               max-w-[250px] break-words gap-3"
          style={{ borderColor: '#08969b', fontWeight: 500 }}
        >
          <div>{fulfillName}</div>
          <Tooltip title="Copy">
            <CopyOutlined
              onClick={() => handleCopy(fulfillName)}
            />
          </Tooltip>
        </div>
      </div>

      {isLastItem && onApplyMapping && !isOrderApplied && isOrderEditing && (
        <div className="mt-3">
          <Button 
            type="primary" 
            size="small"
            onClick={() => onApplyMapping(orderId, orderItems)}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', padding:'15px 20px' }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubItemCost;
