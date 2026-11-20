export const SAMPLE_XSD_NAME = 'Customer.xsd';

export const SAMPLE_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://schemas.company.com/crm/customer"
           xmlns:tns="http://schemas.company.com/crm/customer"
           elementFormDefault="qualified">

  <xs:simpleType name="EmailAddressType">
    <xs:restriction base="xs:string">
      <xs:maxLength value="254"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="CurrencyAmountType">
    <xs:restriction base="xs:decimal">
      <xs:totalDigits value="18"/>
      <xs:fractionDigits value="2"/>
      <xs:minInclusive value="0"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="BoundedScoreType">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="0"/>
      <xs:maxInclusive value="100000"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="AccountTierType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="Standard"/>
      <xs:enumeration value="Gold"/>
      <xs:enumeration value="Enterprise"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:complexType name="BaseAuditEntity">
    <xs:sequence>
      <xs:element name="CreatedAt" type="xs:dateTime" minOccurs="1" nillable="false"/>
    </xs:sequence>
  </xs:complexType>

  <xs:complexType name="AddressComplexType">
    <xs:sequence>
      <xs:element name="City" type="xs:string"/>
      <xs:element name="Country" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

  <xs:element name="Customer">
    <xs:complexType>
      <xs:complexContent>
        <xs:extension base="tns:BaseAuditEntity">
          <xs:sequence>
            <xs:element name="CustomerId" type="xs:int" minOccurs="1" nillable="false"/>
            <xs:element name="CustomerName" type="xs:string" minOccurs="0" nillable="true"/>
            <xs:element name="Email" type="tns:EmailAddressType" minOccurs="0" nillable="true"/>
            <xs:element name="BirthDate" type="xs:date" minOccurs="0" nillable="true"/>
            <xs:element name="PreferredContactTime" type="xs:time" minOccurs="0" nillable="true"/>
            <xs:element name="LoyaltyScore" type="tns:BoundedScoreType" minOccurs="1" nillable="false"/>
            <xs:element name="Balance" type="tns:CurrencyAmountType" minOccurs="0" nillable="true"/>
            <xs:element name="IsActive" type="xs:boolean" minOccurs="1" nillable="false"/>
            <xs:element name="AccountTier" type="tns:AccountTierType" minOccurs="0" nillable="false"/>
            <xs:element name="ProfileAvatar" type="xs:base64Binary" minOccurs="0" nillable="true"/>
            <xs:element name="Address" type="tns:AddressComplexType" minOccurs="0" nillable="true"/>
            <xs:element name="ContractLength" type="xs:duration" minOccurs="0"/>
          </xs:sequence>
          <xs:attribute name="TenantCode" type="xs:normalizedString" use="required"/>
        </xs:extension>
      </xs:complexContent>
    </xs:complexType>
  </xs:element>

  <xs:element name="AuditBatchHeader">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="BatchId" type="xs:long" minOccurs="1"/>
        <xs:element name="GeneratedAt" type="xs:dateTime" minOccurs="1"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;
