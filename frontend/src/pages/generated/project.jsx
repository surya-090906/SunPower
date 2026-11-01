// Native React page. Data contract: backoffice/project.
import { Fragment, cssStyle, text, Partial } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"page-head"}>
        {"\n  "}
        <div>
          {"\n    "}
          <div className={"row"}>
            <h1>{data.v1}</h1>
            <span className={"badge " + text(data.v2)}>{data.v3}</span>
            {data.choice4 === 0 ? (
              <>
                <span className={"badge b-blue"}>{"Subsidy"}</span>
              </>
            ) : null}
          </div>
          {"\n    "}
          <div className={"sub"}>
            <span className={"mono"}>{data.v5}</span>
            {" · "}
            {data.v6}
            {data.choice7 === 0 ? <>{" · factory"}</> : null}
            {" · "}
            <a href={"tel:" + text(data.v8)}>{data.v9}</a>
            {" · owner "}
            {data.v10}
            {" · via "}
            {data.v11}
          </div>
          {"\n  "}
        </div>
        {"\n  "}
        <div className={"row"}>
          <a
            className={"btn btn-line btn-sm"}
            href={"/app/help/customer/" + text(data.v12) + "/"}
          >
            {"Customer 360"}
          </a>
          {data.choice13 === 0 ? (
            <>
              <span className={"badge b-green"}>{"Portal login"}</span>
            </>
          ) : data.choice13 === 1 ? (
            <>
              <span className={"badge b-grey"}>{"No portal login"}</span>
            </>
          ) : null}
        </div>
        {"\n"}
      </div>
      {"\n"}
      {data.choice14 === 0 ? (
        <>
          <div
            className={"gate mb"}
            style={cssStyle(
              data.choice15 === 0
                ? "background:var(--red-s);color:var(--red)"
                : "",
            )}
          >
            {"\n  "}
            <span>{"Next:"}</span>
            <b>{data.v16}</b>
            <span className={"muted small"}>
              {"("}
              {data.v17}
              {data.choice18 === 0 ? (
                <>
                  {", due "}
                  {data.v19}
                </>
              ) : null}
              {")"}
            </span>
            {"\n  "}
            {data.choice20 === 0 ? (
              <>
                <span className={"badge b-red"}>{"overdue"}</span>
              </>
            ) : data.choice20 === 1 ? (
              <>
                <span className={"badge b-amber"}>
                  {data.v21}
                  {" days in this stage"}
                </span>
              </>
            ) : null}
          </div>
        </>
      ) : null}
      {"\n"}
      <div className={"tabs"}>
        {data.rows22?.length ? (
          data.rows22.map((row22, index) => (
            <Fragment key={index}>
              <a
                href={"?tab=" + text(row22.v23)}
                className={row22.choice24 === 0 ? "active" : ""}
              >
                {row22.v25}
              </a>
            </Fragment>
          ))
        ) : (
          <></>
        )}
      </div>
      {"\n"}
      <Partial part={data.part26} state={state} />
      {"\n"}
    </>
  );
}
