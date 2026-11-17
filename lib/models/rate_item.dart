import 'package:flutter/material.dart';

enum RateCategory {
  vegetables,
  fruits,
  grocery,
  meat,
  gold,
  fuel,
  currency,
}

extension RateCategoryExt on RateCategory {
  String get labelUrdu {
    switch (this) {
      case RateCategory.vegetables:
        return 'سبزیاں';
      case RateCategory.fruits:
        return 'پھل';
      case RateCategory.grocery:
        return 'کریانہ';
      case RateCategory.meat:
        return 'گوشت و پولٹری';
      case RateCategory.gold:
        return 'سونا و چاندی';
      case RateCategory.fuel:
        return 'پٹرول و ڈیزل';
      case RateCategory.currency:
        return 'کرنسی';
    }
  }

  String get labelEn {
    switch (this) {
      case RateCategory.vegetables:
        return 'Vegetables';
      case RateCategory.fruits:
        return 'Fruits';
      case RateCategory.grocery:
        return 'Grocery';
      case RateCategory.meat:
        return 'Meat & Poultry';
      case RateCategory.gold:
        return 'Gold & Silver';
      case RateCategory.fuel:
        return 'Fuel';
      case RateCategory.currency:
        return 'Currency';
    }
  }

  IconData get icon {
    switch (this) {
      case RateCategory.vegetables:
        return Icons.eco_rounded;
      case RateCategory.fruits:
        return Icons.apple_rounded;
      case RateCategory.grocery:
        return Icons.shopping_basket_rounded;
      case RateCategory.meat:
        return Icons.set_meal_rounded;
      case RateCategory.gold:
        return Icons.diamond_rounded;
      case RateCategory.fuel:
        return Icons.local_gas_station_rounded;
      case RateCategory.currency:
        return Icons.currency_exchange_rounded;
    }
  }
}

class RateItem {
  final String id;
  final String nameUrdu;
  final String nameEn;
  final RateCategory category;
  final double currentPrice;
  final double previousPrice;
  final String unit;
  final String grade;
  final String city;

  const RateItem({
    required this.id,
    required this.nameUrdu,
    required this.nameEn,
    required this.category,
    required this.currentPrice,
    required this.previousPrice,
    required this.unit,
    this.grade = 'درجہ اول (Grade A)',
    this.city = 'Lahore',
  });

  double get priceDiff => currentPrice - previousPrice;
  bool get isUp => currentPrice > previousPrice;
  bool get isDown => currentPrice < previousPrice;
  bool get isStable => currentPrice == previousPrice;

  double get changePercentage {
    if (previousPrice == 0) return 0.0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }
}
