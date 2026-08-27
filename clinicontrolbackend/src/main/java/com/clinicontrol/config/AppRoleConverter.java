package com.clinicontrol.config;

import com.clinicontrol.entity.AppRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AppRoleConverter implements AttributeConverter<AppRole, String> {

    @Override
    public String convertToDatabaseColumn(AppRole attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public AppRole convertToEntityAttribute(String dbData) {
        return dbData != null ? AppRole.valueOf(dbData) : null;
    }
}
