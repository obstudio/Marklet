<template>
  <table>
    <tr v-for="(row, rowIndex) in node.content" :key="rowIndex">
      <td v-for="(col, colIndex) in row" :key="colIndex"
        v-html="col" :style="{
          textAlign: node.columns[colIndex].align,
          fontWeight: node.columns[colIndex].bold ? 'bold' : '',
        }"/>
    </tr>
  </table>
</template>

<style lang="scss" scoped>

& {
  border-spacing: 0;
  border-collapse: collapse;
  width: fit-content;
  margin: 0 auto 16px;
  display: block;

  td { padding: 6px 13px }
  tr:first-child td { font-weight: bold }
}

</style>
