import type { Brand, Type } from '#/lib/api/types';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from './ui/combobox';
import { useMemo } from 'react';

interface BrandTypeFiltersProps {
    types: Type[];
    brands: Brand[];
    selectedTypeId?: number;
    selectedBrandId?: number;
    onTypeChange: (id: number | undefined) => void;
    onBrandChange: (id: number | undefined) => void;
}

export function BrandTypeFilters({
    types,
    brands,
    selectedTypeId,
    selectedBrandId,
    onTypeChange,
    onBrandChange,
}: BrandTypeFiltersProps) {
    const allItem = useMemo(() => ({ id: -1, name: 'All' }), []);

    const typesWithAll = useMemo(() => {
        return [allItem, ...types];
    }, [types]);

    const brandsWithAll = useMemo(() => {
        return [allItem, ...brands];
    }, [brands]);

    return (
        <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <FilterSection label="Categories">
                    <Combobox
                        defaultValue={typesWithAll.find((t) => t.id === selectedTypeId) ?? typesWithAll[0]}
                        items={typesWithAll}
                        itemToStringValue={(item: Type) => item.id.toString()}
                        itemToStringLabel={(item: Type) => item.name}
                        onValueChange={(value) => onTypeChange(value ? value.id : undefined)}
                    >
                        <ComboboxInput placeholder="Select a type" />
                        <ComboboxContent>
                            <ComboboxEmpty>No types found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: Type) => (
                                    <ComboboxItem key={item.id} value={item}>
                                        {item.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </FilterSection>

                <div className="my-4 h-px bg-border" />

                <FilterSection label="Brands">
                    <Combobox
                        defaultValue={brandsWithAll.find((t) => t.id === selectedBrandId) ?? brandsWithAll[0]}
                        items={brandsWithAll}
                        itemToStringValue={(item: Brand) => item.id.toString()}
                        itemToStringLabel={(item: Brand) => item.name}
                        onValueChange={(value) => onBrandChange(value ? value.id : undefined)}
                    >
                        <ComboboxInput placeholder="Select a brand" />
                        <ComboboxContent>
                            <ComboboxEmpty>No brands found.</ComboboxEmpty>
                            <ComboboxList>
                                {(item: Type) => (
                                    <ComboboxItem key={item.id} value={item}>
                                        {item.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </FilterSection>
            </div>
        </aside>
    );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
            </p>
            {children}
        </div>
    );
}
