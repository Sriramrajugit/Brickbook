class Category {
  final int id;
  final String name;
  final String? description;
  final int? siteId;
  final int companyId;
  final int? createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  Category({
    required this.id,
    required this.name,
    this.description,
    this.siteId,
    required this.companyId,
    this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  // Convert from JSON (server response)
  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      siteId: json['siteId'] as int?,
      companyId: json['companyId'] as int? ?? 1,
      createdBy: json['createdBy'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : DateTime.now(),
    );
  }

  // Convert to JSON (for API requests)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (description != null) 'description': description,
      if (siteId != null) 'siteId': siteId,
      'companyId': companyId,
      if (createdBy != null) 'createdBy': createdBy,
    };
  }

  // Create a copy with modified fields
  Category copyWith({
    int? id,
    String? name,
    String? description,
    int? siteId,
    int? companyId,
    int? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Category(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      siteId: siteId ?? this.siteId,
      companyId: companyId ?? this.companyId,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() => 'Category(id: $id, name: $name, companyId: $companyId)';
}
