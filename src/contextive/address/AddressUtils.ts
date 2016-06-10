export class AddressUtils{

    constructor(){}

    static parseAddress(placeAddressComponent:any):any{
        var components:any = {};
        $.each(placeAddressComponent,
            function(k, v1) {
                $.each(v1.types,
                    function(k2, v2){
                        components[v2] = v1.long_name
                    }
                );
            }
        );
        return components;
    }
}