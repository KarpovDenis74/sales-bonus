/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции

   if (!purchase || purchase.discount === undefined || purchase.quantity === undefined || purchase.sale_price === undefined

   ) {
       return 0;
   }
   const discount = 1 - (purchase.discount / 100);
   const revenue = purchase.sale_price * purchase.quantity * discount;
   return revenue;
//    return parseFloat((Math.round(revenue * 100) / 100).toFixed(2));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
        return 0.15 * seller.profit; 
    }
    else if (index === 1 || index === 2) {
        return 0.1 * seller.profit;
    }
    else if (index === total - 1) {
        return 0;
    }
    else {
        return seller.profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data 
        || data.length === 0 
        || !Array.isArray(data.sellers) 
        || data.sellers.length === 0
        || !Array.isArray(data.purchase_records) 
        || data.purchase_records.length === 0
        || !Array.isArray(data.products)
        || !options || !options.calculateRevenue 
        || !options.calculateBonus) {
        throw new Error('Некорректные входные данные');
    }
    
    // @TODO: Проверка наличия опций
    if (!(typeof options === "object")) {
        throw new Error('Параметр options не является объектом');
    }
    const { calculateRevenue, calculateBonus } = options;
    if (!(typeof calculateRevenue === "function")
        || !(typeof calculateBonus === "function") ){
        throw new Error('calculateRevenue или calculateBonus не являются функциями');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    let sellerStats = data.sellers.map(seller => {
        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {}
        }
    });
    


    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellersIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productsIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(purchase => {
        const seller = sellersIndex[purchase.seller_id];
        seller.sales_count += 1;
        seller.revenue += purchase.total_amount;
        purchase.items.forEach(item => {
            const product = productsIndex[item.sku];
            const cost = Number(product.purchase_price) *  Number(item.quantity);
            const revenue = options.calculateRevenue(item, product);
            seller.profit += Number(revenue) - Number(cost); //revenue - cost;
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });


    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = options.calculateBonus(index, sellerStats.length, seller); // Считаем бонус
        seller.top_products = 
            Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({sku, quantity}))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10); // Формируем топ-10 товаров

    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: parseFloat(Number(seller.revenue).toFixed(2)), //seller.revenue, // Число с двумя знаками после точки, выручка продавца
        profit: parseFloat(Number(seller.profit).toFixed(2)), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: parseFloat(Number(seller.bonus).toFixed(2)), // Число с двумя знаками после точки, бонус продавца
})); 
}

